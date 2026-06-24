import { ApiError } from './client.js';

/**
 * Upload a binary directly to object storage via a presigned PUT URL (ADR-0002).
 * The bytes never pass through the API. Works with a Blob/File (web) or any
 * BodyInit (React Native FormData/blob).
 */
export async function uploadToPresignedUrl(
  uploadUrl: string,
  body: Blob | ArrayBuffer | Uint8Array,
  mime: string,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mime },
    body: body as BodyInit,
    signal,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `Upload failed: ${res.statusText}`);
  }
}
