import { useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SongResponseDto } from "@monorepo/core/api";
import { songMeta, statusLabel } from "../lib/model";
import { StatusDot } from "./primitives";

const ROW_GAP = 8;

/**
 * Album track list with drag-to-reorder on the grip handle (frames 8 & 11).
 * Reorders locally while dragging and reports the final id order on drop.
 */
export function ReorderableTrackList({
  tracks: serverTracks,
  onReorder,
}: {
  tracks: SongResponseDto[];
  onReorder?: (songIds: string[]) => void;
}) {
  const [tracks, setTracks] = useState(serverTracks);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const rowHeight = useRef(0);
  const startY = useRef(0);
  const navigate = useNavigate();

  // adopt server order whenever we're not mid-drag
  useEffect(() => {
    setTracks(serverTracks);
  }, [serverTracks]);

  function startDrag(e: React.PointerEvent, index: number) {
    const row = (e.target as HTMLElement).closest("[data-track-row]") as HTMLElement | null;
    if (!row) return;
    e.preventDefault();
    rowHeight.current = row.offsetHeight + ROW_GAP;
    startY.current = e.clientY;
    setDragIndex(index);
    setDragOffset(0);

    let current = index;
    let order = tracks;
    const onMove = (ev: PointerEvent) => {
      let offset = ev.clientY - startY.current;
      const step = rowHeight.current;
      const move = (from: number, to: number) => {
        const next = [...order];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        order = next;
        setTracks(next);
        current = to;
        setDragIndex(to);
      };
      while (offset > step / 2 && current < order.length - 1) {
        move(current, current + 1);
        startY.current += step;
        offset -= step;
      }
      while (offset < -step / 2 && current > 0) {
        move(current, current - 1);
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
      if (current !== index && onReorder) {
        onReorder(order.map((t) => t.id));
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div className="flex flex-col" style={{ gap: ROW_GAP }}>
      {tracks.map((song, index) => {
        const dragging = index === dragIndex;
        const untitled = song.status === "draft" && !song.key;
        return (
          <div
            key={song.id}
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
                {song.title}
              </div>
            </div>
            <span className="font-mono text-xs text-meta-2">
              {song.key ? songMeta(song) : statusLabel[song.status]}
            </span>
            <StatusDot status={song.status} />
          </div>
        );
      })}
    </div>
  );
}
