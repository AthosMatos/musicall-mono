import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { songsSearchOptions } from "@monorepo/core/api";
import { songMeta, statusLabel } from "../lib/model";
import { StatusDot } from "./primitives";

/**
 * Modal for adding an existing song to a collection. Lists songs not already
 * in the collection, with a search box, and reports the picked id via `onAdd`.
 */
export function AddTrackDialog({
  existingIds,
  isAdding,
  onAdd,
  onClose,
}: {
  existingIds: string[];
  isAdding: boolean;
  onAdd: (songId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim();

  const songsQuery = useQuery(songsSearchOptions({ q: q || undefined, pageSize: 60 }));
  const existing = new Set(existingIds);
  const candidates = (songsQuery.data?.items ?? []).filter((s) => !existing.has(s.id));

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-[460px] flex-col overflow-hidden rounded-2xl border border-border-alt bg-bg shadow-drag"
      >
        <header className="flex items-center gap-4 border-b border-border px-5 py-4">
          <h2 className="m-0 flex-1 text-lg font-semibold text-ink">Adicionar faixa</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex cursor-pointer border-none bg-transparent p-0 text-[#7a7268] hover:text-ink-2"
          >
            <X size={20} />
          </button>
        </header>

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
      </div>
    </div>
  );
}
