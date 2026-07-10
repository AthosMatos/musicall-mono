import { useState } from "react";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import {
  ConfirmUploadDto,
  mediaConfirm,
  mediaListForSongKey,
  mediaPresign,
  PresignUploadDto,
  uploadToPresignedUrl,
} from "@monorepo/core/api";
import { useQueryClient } from "@tanstack/react-query";

/** Best-effort duration probe so the asset shows a length like recorded takes do. */
async function probeDurationSec(uri: string): Promise<number | undefined> {
  try {
    const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    const millis = status.isLoaded ? status.durationMillis : undefined;
    await sound.unloadAsync();
    return millis ? Math.round(millis / 1000) : undefined;
  } catch {
    return undefined;
  }
}

export type AudioFile = {
  uri: string;
  name: string;
  mime: string;
  /** Optional — falls back to the fetched blob's size when 0/unknown. */
  sizeBytes?: number;
};

/**
 * Uploads a local audio file to a song via the presign → PUT → confirm flow
 * (ADR-0002 — bytes go straight to storage, never through the API).
 */
export async function uploadAudioToSong(songId: string, file: AudioFile): Promise<void> {
  const blob = await (await fetch(file.uri)).blob();
  const sizeBytes = file.sizeBytes && file.sizeBytes > 0 ? file.sizeBytes : blob.size;
  if (!sizeBytes) throw new Error("arquivo de áudio vazio");

  const presign = await mediaPresign({
    type: PresignUploadDto.type.AUDIO,
    mime: file.mime,
    sizeBytes,
    songId,
  });
  await uploadToPresignedUrl(presign.uploadUrl, blob, file.mime);

  const durationSec = await probeDurationSec(file.uri);
  await mediaConfirm({
    storageKey: presign.storageKey,
    type: ConfirmUploadDto.type.AUDIO,
    label: file.name || "gravação",
    mime: file.mime,
    sizeBytes,
    durationSec,
    songId,
  });
}

/**
 * Picks an audio file from the device and uploads it to a song via the
 * presign → PUT → confirm flow (ADR-0002 — bytes go straight to storage).
 */
export function useMediaUpload(songId: string) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickAndUpload() {
    setError(null);
    const picked = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
    });
    if (picked.canceled) return;

    const file = picked.assets[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadAudioToSong(songId, {
        uri: file.uri,
        name: file.name || "gravação",
        mime: file.mimeType ?? "audio/mpeg",
        sizeBytes: file.size ?? 0,
      });
      await queryClient.invalidateQueries({ queryKey: mediaListForSongKey(songId) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "erro ao enviar");
    } finally {
      setIsUploading(false);
    }
  }

  return { pickAndUpload, isUploading, error };
}
