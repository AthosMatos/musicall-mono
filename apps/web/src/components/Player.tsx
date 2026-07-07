import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { AudioAsset } from "../data/songbook";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

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

/** Mock playback clock — advances progress while "playing". */
function usePlayback(durationSeconds: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    timer.current = setInterval(() => {
      setElapsed((t) => {
        if (t + 0.25 >= durationSeconds) {
          setIsPlaying(false);
          return 0;
        }
        return t + 0.25;
      });
    }, 250);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [isPlaying, durationSeconds]);

  return {
    isPlaying,
    elapsed,
    progress: durationSeconds ? elapsed / durationSeconds : 0,
    toggle: () => setIsPlaying((p) => !p),
    seek: (fraction: number) => setElapsed(fraction * durationSeconds),
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
export function PlayerCard({ audio }: { audio: AudioAsset }) {
  const playback = usePlayback(audio.durationSeconds);
  return (
    <div className="rounded-card border border-border-alt bg-surface p-[15px]">
      <div className="mb-[13px]">
        <Waveform samples={audio.samples} progress={playback.progress} height={42} onSeek={playback.seek} />
      </div>
      <div className="flex items-center gap-[13px]">
        <PlayButton isPlaying={playback.isPlaying} onClick={playback.toggle} />
        <span className="truncate font-mono text-xs text-meta-2">{audio.filename}</span>
        <span className="ml-auto font-mono text-xs text-meta-2">
          {playback.elapsed > 0 ? formatTime(playback.elapsed) : audio.durationLabel}
        </span>
      </div>
    </div>
  );
}
