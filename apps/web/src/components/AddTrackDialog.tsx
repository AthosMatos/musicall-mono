import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { songsSearchOptions } from "@monorepo/core/api";
import { songMeta, statusLabel } from "../lib/model";
import { StatusDot } from "./primitives";
import { AppModal } from "./ui/modal";

/**
 * Modal for adding an existing song to a collection. Lists songs not already
 * in the collection, with a search box, and reports the picked id via `onAdd`.
 */
export function AddTrackDialog({
  open,
  existingIds,
  isAdding,
  onAdd,
  onClose,
}: {
  open: boolean;
  existingIds: string[];
  isAdding: boolean;
  onAdd: (songId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim();

  // Clear the search each time the modal opens (adjust state during render).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setQuery("");
  }

  const songsQuery = useQuery({
    ...songsSearchOptions({ q: q || undefined, pageSize: 60 }),
    enabled: open,
  });
  const existing = new Set(existingIds);
  const candidates = (songsQuery.data?.items ?? []).filter((s) => !existing.has(s.id));

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Adicionar faixa"
      className="w-[460px]"
      contentClassName="flex min-h-0 flex-1 flex-col"
    >
      <label className="mx-5 mt-4 flex h-11 items-center gap-[9px] rounded-xl border border-border-strong bg-surface-alt px-[15px]">
        <Search size={15} className="shrink-0 text-faint" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar músicas…"
          className="w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-faint"
        />
      </label>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 pt-3">
        {songsQuery.isLoading && (
          <div className="py-8 text-center font-mono text-xs text-faint">carregando…</div>
        )}
        {!songsQuery.isLoading && candidates.length === 0 && (
          <div className="py-8 text-center font-mono text-xs text-faint">
            {q ? "nenhuma música encontrada" : "todas as músicas já estão nesta coleção"}
          </div>
        )}
        <div className="flex flex-col gap-2">
          {candidates.map((song) => {
            const untitled = song.status === "draft" && !song.key;
            return (
              <button
                key={song.id}
                type="button"
                disabled={isAdding}
                onClick={() => onAdd(song.id)}
                className="flex items-center gap-3 rounded-xl border border-border-alt bg-surface px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60 not-disabled:cursor-pointer hover:border-border-active"
              >
                <StatusDot status={song.status} />
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-base font-semibold ${untitled ? "text-ink-2" : "text-ink"}`}>
                    {song.title}
                  </div>
                </div>
                <span className="font-mono text-xs text-meta-2">
                  {song.key ? songMeta(song) : statusLabel[song.status]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </AppModal>
  );
}
