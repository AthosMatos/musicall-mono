import { useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSong, type SeedTrack } from "../data/songbook";
import { StatusDot } from "./primitives";

const ROW_GAP = 8;

/** Album track list with drag-to-reorder on the grip handle (frames 8 & 11). */
export function ReorderableTrackList({ tracks: initialTracks }: { tracks: SeedTrack[] }) {
  const [tracks, setTracks] = useState(initialTracks);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const rowHeight = useRef(0);
  const startY = useRef(0);
  const navigate = useNavigate();

  function startDrag(e: React.PointerEvent, index: number) {
    const row = (e.target as HTMLElement).closest("[data-track-row]") as HTMLElement | null;
    if (!row) return;
    e.preventDefault();
    rowHeight.current = row.offsetHeight + ROW_GAP;
    startY.current = e.clientY;
    setDragIndex(index);
    setDragOffset(0);

    let current = index;
    const onMove = (ev: PointerEvent) => {
      let offset = ev.clientY - startY.current;
      const step = rowHeight.current;
      while (offset > step / 2 && current < tracks.length - 1) {
        setTracks((t) => {
          const next = [...t];
          const [moved] = next.splice(current, 1);
          next.splice(current + 1, 0, moved);
          return next;
        });
        current += 1;
        setDragIndex(current);
        startY.current += step;
        offset -= step;
      }
      while (offset < -step / 2 && current > 0) {
        setTracks((t) => {
          const next = [...t];
          const [moved] = next.splice(current, 1);
          next.splice(current - 1, 0, moved);
          return next;
        });
        current -= 1;
        setDragIndex(current);
        startY.current -= step;
        offset += step;
      }
      setDragOffset(offset);
    };
    const onUp = () => {
      setDragIndex(null);
      setDragOffset(0);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div className="flex flex-col" style={{ gap: ROW_GAP }}>
      {tracks.map((track, index) => {
        const song = getSong(track.songId);
        if (!song) return null;
        const dragging = index === dragIndex;
        const untitled = song.status === "draft" && !song.key;
        return (
          <div
            key={`${track.songId}-${index}`}
            data-track-row
            onClick={() => {
              if (dragIndex === null) navigate(`/songs/${song.id}`);
            }}
            className={`flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-[14px] select-none ${
              dragging
                ? "relative z-10 border-border-drag bg-surface-drag shadow-drag"
                : "border-border-alt bg-surface"
            }`}
            style={dragging ? { transform: `translateY(${dragOffset}px) scale(1.01)` } : undefined}
          >
            <span
              onPointerDown={(e) => startDrag(e, index)}
              onClick={(e) => e.stopPropagation()}
              className={`touch-none ${dragging ? "cursor-grabbing text-accent" : "cursor-grab text-faint-2"}`}
              aria-label="Arrastar para reordenar"
            >
              <GripVertical size={16} />
            </span>
            <span className="w-[18px] font-mono text-[13px] text-meta-2">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-base font-semibold ${untitled ? "text-ink-2" : "text-ink"}`}>
                {untitled ? "faixa sem título" : song.title}
              </div>
            </div>
            <span className="font-mono text-xs text-meta-2">
              {track.durationLabel
                ? `${song.key ? `${song.key} · ` : ""}${track.durationLabel}`
                : "só áudio"}
            </span>
            <StatusDot status={song.status} />
          </div>
        );
      })}
    </div>
  );
}
