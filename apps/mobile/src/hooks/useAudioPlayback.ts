import { Audio, type AVPlaybackStatus } from "expo-av";
import { useEffect, useRef, useState } from "react";

/**
 * Plays a `MediaAsset` straight off the device — the URI is a local file in the
 * app's document directory, so there is nothing to fetch or sign.
 */
export function useAudioPlayback(uri: string, initialDurationSec: number | null) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(initialDurationSec ?? 0);
  const [error, setError] = useState(false);

  // A different asset means the loaded sound is stale — drop it.
  useEffect(() => {
    return () => {
      void soundRef.current?.unloadAsync();
      soundRef.current = null;
      setIsPlaying(false);
      setElapsed(0);
    };
  }, [uri]);

  function onStatus(status: AVPlaybackStatus) {
    if (!status.isLoaded) return;
    setElapsed((status.positionMillis ?? 0) / 1000);
    if (status.durationMillis) setDuration(status.durationMillis / 1000);
    if (status.didJustFinish) {
      setIsPlaying(false);
      setElapsed(0);
    }
  }

  /**
   * Jumps to a fraction (0–1) of the track. Works before the first play too:
   * the sound is loaded paused at the requested spot rather than ignored.
   */
  async function seek(ratio: number) {
    const target = Math.min(1, Math.max(0, ratio));
    try {
      if (!soundRef.current) {
        const positionMillis = Math.round(target * duration * 1000);
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { positionMillis, shouldPlay: false },
          onStatus
        );
        soundRef.current = sound;
        setElapsed(positionMillis / 1000);
        return;
      }
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      // Prefer the loaded track's real length over the stored metadata.
      const totalMillis = status.durationMillis ?? duration * 1000;
      const positionMillis = Math.round(target * totalMillis);
      await soundRef.current.setPositionAsync(positionMillis);
      setElapsed(positionMillis / 1000);
    } catch {
      setError(true);
    }
  }

  async function toggle() {
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true }, onStatus);
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
    seek,
  };
}
