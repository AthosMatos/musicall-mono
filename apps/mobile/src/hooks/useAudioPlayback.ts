import { useEffect, useRef, useState } from "react";
import { Audio, type AVPlaybackStatus } from "expo-av";
import { mediaGetUrl } from "@monorepo/core/api";

/**
 * Streams a MediaAsset through expo-av, fed by a short-lived signed URL from
 * `GET /api/media/{id}/url` (ADR-0002 — bytes come straight from storage).
 */
export function useAudioPlayback(assetId: string, initialDurationSec: number | null) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(initialDurationSec ?? 0);
  const [error, setError] = useState(false);

  useEffect(() => {
    return () => {
      void soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, [assetId]);

  function onStatus(status: AVPlaybackStatus) {
    if (!status.isLoaded) return;
    setElapsed((status.positionMillis ?? 0) / 1000);
    if (status.durationMillis) setDuration(status.durationMillis / 1000);
    if (status.didJustFinish) {
      setIsPlaying(false);
      setElapsed(0);
    }
  }

  async function toggle() {
    try {
      if (!soundRef.current) {
        const { url } = await mediaGetUrl(assetId);
        const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true }, onStatus);
        soundRef.current = sound;
        setIsPlaying(true);
        return;
      }
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch {
      setError(true);
    }
  }

  return {
    isPlaying,
    elapsed,
    duration,
    error,
    progress: duration ? elapsed / duration : 0,
    toggle,
  };
}
