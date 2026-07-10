import {
  ConfirmUploadDto,
  mediaConfirm,
  mediaPresign,
  PresignUploadDto,
  uploadToPresignedUrl,
} from "@monorepo/core/api";

/**
 * Uploads an image as a collection's cover via the presign → PUT → confirm flow
 * (ADR-0002 — bytes go straight to storage, never through the API) and returns
 * the created media asset id to store on the collection's `coverMediaId`.
 */
export async function uploadCollectionCover(collectionId: string, file: File): Promise<string> {
  if (!file.size) throw new Error("imagem vazia");

  const presign = await mediaPresign({
    type: PresignUploadDto.type.IMAGE,
    mime: file.type,
    sizeBytes: file.size,
    collectionId,
  });
  await uploadToPresignedUrl(presign.uploadUrl, file, file.type);

  const asset = await mediaConfirm({
    storageKey: presign.storageKey,
    type: ConfirmUploadDto.type.IMAGE,
    label: file.name || "capa",
    mime: file.type,
    sizeBytes: file.size,
    collectionId,
  });
  return asset.id;
}
