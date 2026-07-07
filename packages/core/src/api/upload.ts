import axios from 'axios';
import { ApiError } from './client.js';

/**
 * Upload a binary directly to object storage via a presigned PUT URL (ADR-0002).
 * The bytes never pass through the API. Works with a Blob/File (web) or any
 * binary body (React Native blob).
 */
export async function uploadToPresignedUrl(
  uploadUrl: string,
  body: Blob | ArrayBuffer | Uint8Array,
  mime: string,
  signal?: AbortSignal,
): Promise<void> {
  try {
    await axios.put(uploadUrl, body, {
      headers: { 'Content-Type': mime },
      signal,
      // presigned URLs are self-authorizing; never attach cookies/tokens
      withCredentials: false,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.status,
        `Upload failed: ${error.response.statusText}`,
      );
    }
    throw error;
  }
}
