import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { mediaGetUrl, type MediaAssetResponseDto } from "@monorepo/core/api";
import { formatDuration, waveformSamples } from "../lib/model";

export function Waveform({
  samples,
  progress,
  height,
  onSeek,
}: {
  samples: number[];
  /** 0–1 fraction already played */
  progress: number;
  height: number;
  onSeek?: (fraction: number) => void;
}) {
  const playedBars = Math.round(progress * samples.length);
  return (
    <div
      className={`flex items-end gap-[2px] ${onSeek ? "cursor-pointer" : ""}`}
      style={{ height }}
      onClick={(e) => {
        if (!onSeek) return;
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
      }}
    >
      {samples.map((h, i) => (
        <div
          key={i}
          className="min-w-0 flex-1 rounded-[1px]"
          style={{
            height: `${h}%`,
            background:
              i < playedBars
                ? "var(--color-wave-played)"
                : i === playedBars
                  ? "var(--color-wave-warm)"
                  : "var(--color-wave-muted)",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Streams the asset through an HTMLAudioElement fed by a short-lived signed
 * URL from `GET /api/media/{id}/url` (ADR-0002 — bytes come from storage).
 */
function useAudioPlayback(asset: MediaAssetResponseDto) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(asset.durationSec ?? 0);
  const [error, setError] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [asset.id]);

  async function ensureAudio(): Promise<HTMLAudioElement | null> {
    if (audioRef.current) return audioRef.current;
    try {
      const { url } = await mediaGetUrl(asset.id);
      const audio = new Audio(url);
      audio.addEventListener("timeupdate", () => setElapsed(audio.currentTime));
      audio.addEventListener("durationchange", () => {
        if (Number.isFinite(audio.duration)) setDuration(audio.duration);
      });
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setElapsed(0);
      });
      audio.addEventListener("error", () => {
        setError(true);
        setIsPlaying(false);
      });
      audioRef.current = audio;
      return audio;
    } catch {
      setError(true);
      return null;
    }
  }

  async function toggle() {
    const audio = await ensureAudio();
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setError(true);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  async function seek(fraction: number) {
    const audio = await ensureAudio();
    if (!audio || !duration) return;
    audio.currentTime = fraction * duration;
    setElapsed(audio.currentTime);
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

export function PlayButton({
  isPlaying,
  onClick,
  size = 38,
}: {
  isPlaying: boolean;
  onClick: () => void;
  size?: number;
}) {
  const Icon = isPlaying ? Pause : Play;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPlaying ? "Pausar" : "Tocar"}
      className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-accent text-on-accent"
      style={{ width: size, height: size }}
    >
      <Icon size={size * 0.42} fill="currentColor" strokeWidth={0} />
    </button>
  );
}

/** Side-panel player card (Song Detail web, frame 4). */
export function PlayerCard({ asset }: { asset: MediaAssetResponseDto }) {
  const playback = useAudioPlayback(asset);
  const samples = waveformSamples(asset.id);
  return (
    <div className="rounded-card border border-border-alt bg-surface p-[15px]">
      <div className="mb-[13px]">
        <Waveform
          samples={samples}
          progress={playback.progress}
          height={42}
          onSeek={(f) => void playback.seek(f)}
        />
      </div>
      <div className="flex items-center gap-[13px]">
        <PlayButton isPlaying={playback.isPlaying} onClick={() => void playback.toggle()} />
        <span className="truncate font-mono text-xs text-meta-2">{asset.label}</span>
        <span className="ml-auto font-mono text-xs text-meta-2">
          {playback.error
            ? "erro"
            : playback.elapsed > 0
              ? formatDuration(playback.elapsed)
              : (formatDuration(playback.duration) ?? "—")}
        </span>
      </div>
    </div>
  );
}
