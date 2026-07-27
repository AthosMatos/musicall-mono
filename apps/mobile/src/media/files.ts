/**
 * Local file storage for media. Recordings, imported audio and picked images
 * all start life somewhere temporary (the recorder's cache file, the picker's
 * copy); this module moves the bytes into the app's document directory so they
 * survive the OS reclaiming the cache, and hands back a stable `file://` URI to
 * store on the Realm `MediaAsset` row.
 */
import { Directory, File, Paths } from "expo-file-system";

/** Sub-folders of the document directory, one per kind of asset. */
export type MediaFolder = "audio" | "images";

function folder(name: MediaFolder): Directory {
  const dir = new Directory(Paths.document, name);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** ".m4a" from ".../recording.m4a"; empty string when there is none. */
export function extensionFromUri(uri: string): string {
  const name = uri.split("?")[0].split("/").pop() ?? "";
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot).toLowerCase() : "";
}

const audioMimes: Record<string, string> = {
  ".caf": "audio/x-caf",
  ".wav": "audio/wav",
  ".3gp": "audio/3gpp",
  ".mp3": "audio/mpeg",
  ".aac": "audio/aac",
  ".m4a": "audio/m4a",
};

export function audioMimeFromUri(uri: string): string {
  return audioMimes[extensionFromUri(uri)] ?? "audio/m4a";
}

const imageMimes: Record<string, string> = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

export function imageMimeFromUri(uri: string): string {
  return imageMimes[extensionFromUri(uri)] ?? "image/jpeg";
}

export interface StoredFile {
  uri: string;
  sizeBytes: number;
}

/**
 * Copies `sourceUri` into the app's document directory under `folderName`,
 * naming the copy after `id` so it is trivially traceable back to its row.
 */
export function storeFile(sourceUri: string, folderName: MediaFolder, id: string): StoredFile {
  const source = new File(sourceUri);
  const target = new File(folder(folderName), `${id}${extensionFromUri(sourceUri)}`);
  if (target.exists) target.delete();
  source.copy(target);
  return { uri: target.uri, sizeBytes: target.size };
}

/** Best-effort unlink — a missing file is not an error worth surfacing. */
export function deleteFile(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The row is already gone; a stray file is not worth failing the write.
  }
}

export function deleteFiles(uris: readonly (string | null | undefined)[]): void {
  for (const uri of uris) deleteFile(uri);
}
