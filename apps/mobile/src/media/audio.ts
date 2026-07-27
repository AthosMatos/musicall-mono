/**
 * Bringing audio into the library: probing its length, copying the bytes into
 * the document directory and recording a `MediaAsset` row for it.
 */
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type Realm from "realm";
import { createMediaAsset, newId, useRealm } from "@/db";
import { audioMimeFromUri, storeFile } from "./files";

/** Best-effort duration probe so imported files show a length like takes do. */
export async function probeDurationSec(uri: string): Promise<number | null> {
  try {
    const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    const millis = status.isLoaded ? status.durationMillis : undefined;
    await sound.unloadAsync();
    return millis ? Math.round(millis / 1000) : null;
  } catch {
    return null;
  }
}

export interface AudioFile {
  uri: string;
  name: string;
  mime?: string;
}

/**
 * Copies a local audio file into the app's storage and attaches it to a song.
 * Used by both the recorder (its cache file) and the document picker.
 */
export async function importAudioToSong(
  realm: Realm,
  songId: string,
  file: AudioFile
): Promise<void> {
  const id = newId();
  const stored = storeFile(file.uri, "audio", id);
  const durationSec = await probeDurationSec(stored.uri);
  createMediaAsset(realm, {
    songId,
    type: "audio",
    label: file.name,
    mime: file.mime ?? audioMimeFromUri(file.uri),
    sizeBytes: stored.sizeBytes,
    durationSec,
    uri: stored.uri,
  });
}

/** Picks an audio file from the device and attaches it to `songId`. */
export function useAudioImport(songId: string) {
  const realm = useRealm();
  const { t } = useTranslation();
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickAndImport() {
    setError(null);
    const picked = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
    });
    if (picked.canceled) return;

    const file = picked.assets[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await importAudioToSong(realm, songId, {
        uri: file.uri,
        name: file.name || t("capture.recordingName"),
        mime: file.mimeType ?? undefined,
      });
    } catch {
      setError(t("media.importError"));
    } finally {
      setIsImporting(false);
    }
  }

  return { pickAndImport, isImporting, error };
}
