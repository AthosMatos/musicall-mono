/**
 * Picking images from the device: the onboarding avatar and song artwork.
 * Both end up as files in the document directory (see `./files`).
 */
import * as ImagePicker from "expo-image-picker";
import type Realm from "realm";
import { createMediaAsset, newId, useRealm } from "@/db";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { deleteFile, imageMimeFromUri, storeFile } from "./files";

/**
 * Opens the gallery and copies the picked image into permanent storage.
 * Returns `null` when the user cancels or denies the permission.
 */
export async function pickAndStoreImage(
  folderId: string,
  options?: { square?: boolean }
): Promise<{ uri: string; sizeBytes: number; mime: string } | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: options?.square ? [1, 1] : undefined,
    quality: 0.85,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) return null;

  const stored = storeFile(asset.uri, "images", folderId);
  return { ...stored, mime: imageMimeFromUri(asset.uri) };
}

/** Picks an avatar and returns its permanent URI, replacing any previous one. */
export async function pickAvatar(previousUri: string | null): Promise<string | null> {
  const picked = await pickAndStoreImage(`avatar-${newId()}`, { square: true });
  if (!picked) return null;
  // The new file has a different name, so the old one has to go explicitly.
  if (previousUri && previousUri !== picked.uri) deleteFile(previousUri);
  return picked.uri;
}

/** Picks an image and files it under a song as a `MediaAsset`. */
export async function importImageToSong(
  realm: Realm,
  songId: string,
  label: string
): Promise<void> {
  const id = newId();
  const picked = await pickAndStoreImage(id);
  if (!picked) return;
  createMediaAsset(realm, {
    songId,
    type: "image",
    label,
    mime: picked.mime,
    sizeBytes: picked.sizeBytes,
    uri: picked.uri,
  });
}

/** Picks an image and files it under a collection as a `MediaAsset`. */
export async function importImageToCollection(
  realm: Realm,
  collectionId: string,
  label: string
): Promise<void> {
  const id = newId();
  const picked = await pickAndStoreImage(id);
  if (!picked) return;
  createMediaAsset(realm, {
    collectionId,
    type: "image",
    label,
    mime: picked.mime,
    sizeBytes: picked.sizeBytes,
    uri: picked.uri,
  });
  // No cover is set here on purpose: with none chosen explicitly, the oldest
  // image is the cover (see `db/covers.ts`), so the first one added just works.
}

/** Screen-facing wrapper around the importers above, with busy/error state. */
export function useImageImport(target: { songId: string } | { collectionId: string }) {
  const realm = useRealm();
  const { t } = useTranslation();
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const songId = "songId" in target ? target.songId : null;
  const collectionId = "collectionId" in target ? target.collectionId : null;

  async function pickAndImport() {
    setError(null);
    setIsImporting(true);
    try {
      if (songId) await importImageToSong(realm, songId, t("song.tabImages"));
      else if (collectionId)
        await importImageToCollection(realm, collectionId, t("album.photos"));
    } catch {
      setError(t("media.importError"));
    } finally {
      setIsImporting(false);
    }
  }

  return { pickAndImport, isImporting, error };
}
