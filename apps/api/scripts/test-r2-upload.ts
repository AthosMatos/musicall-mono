/**
 * Standalone smoke test for Cloudflare R2 uploads.
 *
 * Exercises the exact production path used by MediaService/StorageService —
 * presign a PUT → upload bytes → presign a GET → download & verify → delete —
 * straight against real R2, with no server, auth, or database involved.
 *
 * Run from apps/api:  pnpm test:r2
 * Optionally upload your own files instead of the built-in samples:
 *   pnpm test:r2 ./cover.png ./demo.mp3
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Missing env var ${name} (is apps/api/.env present?)`);
    process.exit(1);
  }
  return value;
}

const bucket = requireEnv('S3_BUCKET');
const expiresIn = Number(process.env.S3_PRESIGN_EXPIRES_SECONDS ?? 900);

// Same client config as StorageService.
const client = new S3Client({
  endpoint: requireEnv('S3_ENDPOINT'),
  region: process.env.S3_REGION ?? 'auto',
  forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
  credentials: {
    accessKeyId: requireEnv('S3_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('S3_SECRET_ACCESS_KEY'),
  },
});

/** Same key shape as StorageService.buildKey. Prefixed so test objects are easy to spot. */
function buildKey(type: string, mime: string): string {
  const ext = mime.split('/')[1]?.replace(/[^a-z0-9]/gi, '') ?? 'bin';
  return `smoke-test/${type}/${randomUUID()}.${ext}`;
}

type Sample = { name: string; type: 'image' | 'audio'; mime: string; body: Buffer };

/** A valid 1×1 transparent PNG. */
const SAMPLE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

/** A minimal valid WAV: 44-byte header + a few silent 16-bit mono samples. */
function makeWav(): Buffer {
  const samples = 8;
  const dataSize = samples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // fmt chunk size
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(8000, 24); // sample rate
  buf.writeUInt32LE(8000 * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  return buf;
}

function mimeFor(path: string): { type: 'image' | 'audio'; mime: string } {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, { type: 'image' | 'audio'; mime: string }> = {
    png: { type: 'image', mime: 'image/png' },
    jpg: { type: 'image', mime: 'image/jpeg' },
    jpeg: { type: 'image', mime: 'image/jpeg' },
    webp: { type: 'image', mime: 'image/webp' },
    mp3: { type: 'audio', mime: 'audio/mpeg' },
    m4a: { type: 'audio', mime: 'audio/mp4' },
    wav: { type: 'audio', mime: 'audio/wav' },
    caf: { type: 'audio', mime: 'audio/x-caf' },
  };
  return map[ext] ?? { type: 'image', mime: 'application/octet-stream' };
}

function samplesFromArgs(paths: string[]): Sample[] {
  if (paths.length === 0) {
    return [
      { name: 'sample.png', type: 'image', mime: 'image/png', body: SAMPLE_PNG },
      { name: 'sample.wav', type: 'audio', mime: 'audio/wav', body: makeWav() },
    ];
  }
  return paths.map((p) => {
    const { type, mime } = mimeFor(p);
    return { name: basename(p), type, mime, body: readFileSync(p) };
  });
}

async function roundTrip(sample: Sample): Promise<boolean> {
  const key = buildKey(sample.type, sample.mime);
  const label = `${sample.name} (${sample.mime}, ${sample.body.length} bytes)`;
  console.log(`\n── ${label}`);
  console.log(`   key: ${key}`);

  try {
    // 1. presign PUT + upload the bytes directly to R2 (what the client does)
    const putUrl = await getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: sample.mime }),
      { expiresIn },
    );
    const put = await fetch(putUrl, {
      method: 'PUT',
      body: new Uint8Array(sample.body),
      headers: { 'Content-Type': sample.mime },
    });
    if (!put.ok) {
      console.error(`   ❌ PUT failed: ${put.status} ${put.statusText}`);
      console.error(`      ${(await put.text()).slice(0, 300)}`);
      return false;
    }
    console.log(`   ✓ uploaded (PUT ${put.status})`);

    // 2. presign GET + download, verify bytes match
    const getUrl = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn },
    );
    const get = await fetch(getUrl);
    if (!get.ok) {
      console.error(`   ❌ GET failed: ${get.status} ${get.statusText}`);
      return false;
    }
    const downloaded = Buffer.from(await get.arrayBuffer());
    if (!downloaded.equals(sample.body)) {
      console.error(
        `   ❌ byte mismatch: uploaded ${sample.body.length}, got ${downloaded.length}`,
      );
      return false;
    }
    console.log(`   ✓ downloaded & verified (${downloaded.length} bytes match)`);

    // 3. delete
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log('   ✓ deleted');
    return true;
  } catch (err) {
    console.error(`   ❌ error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function main(): Promise<void> {
  const samples = samplesFromArgs(process.argv.slice(2));
  console.log(`R2 upload smoke test → bucket "${bucket}" @ ${process.env.S3_ENDPOINT}`);

  const results = await Promise.all(samples.map(roundTrip));
  const passed = results.filter(Boolean).length;

  console.log(`\n${'─'.repeat(40)}`);
  if (passed === results.length) {
    console.log(`✅ all ${results.length} upload(s) round-tripped through R2`);
    process.exit(0);
  }
  console.log(`❌ ${results.length - passed}/${results.length} failed`);
  process.exit(1);
}

void main();
