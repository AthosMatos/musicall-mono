import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { songsSearchOptions } from "@monorepo/core/api";
import { CoverArt, StatusDot } from "../components/primitives";
import { songCover, songMeta, statusLabel } from "../lib/model";

export default function SongsPage({ favoritesOnly = false }: { favoritesOnly?: boolean }) {
  const [query, setQuery] = useState("");
  const q = query.trim();

  const songsQuery = useQuery(
    songsSearchOptions({
      q: q || undefined,
      favorite: favoritesOnly || undefined,
      pageSize: 60,
    }),
  );
  const songs = songsQuery.data?.items ?? [];
  const total = songsQuery.data?.total ?? 0;

  return (
    <>
      <header className="flex items-center gap-5 border-b border-border px-9 pt-[26px] pb-[18px]">
        <div className="flex-1">
          <h1 className="m-0 text-[30px] font-semibold tracking-[-0.02em] text-ink">
            {favoritesOnly ? "Favoritas" : "Todas as músicas"}
          </h1>
          <div className="mt-[3px] font-mono text-xs text-meta-2">
            {songsQuery.isLoading
              ? "carregando…"
              : `${total} música${total === 1 ? "" : "s"} · ordenar por: editadas recentemente ▾`}
          </div>
        </div>
        <label className="flex h-11 w-[300px] items-center gap-[9px] rounded-xl border border-border-strong bg-surface-alt px-[15px]">
          <Search size={15} className="shrink-0 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar…"
            className="w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
        </label>
        <Link
          to="/songs/new"
          className="flex h-11 items-center gap-2 rounded-xl bg-accent px-[18px] text-sm font-semibold text-on-accent no-underline"
        >
          <Plus size={16} strokeWidth={2.5} /> Nova música
        </Link>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-9 pt-6">
        {songsQuery.isError && (
          <div className="mb-5 flex items-center gap-3 rounded-[10px] border border-[rgba(194,94,68,.35)] bg-[rgba(194,94,68,.1)] px-[13px] py-[10px] font-mono text-xs text-accent-soft">
            não foi possível carregar as músicas
            <button
              type="button"
              onClick={() => void songsQuery.refetch()}
              className="cursor-pointer rounded-md border border-[rgba(194,94,68,.35)] bg-transparent px-2 py-1 font-mono text-[11px] text-accent-soft"
            >
              tentar de novo
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-5">
          {songsQuery.isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[218px] animate-pulse rounded-card border border-border-alt bg-surface" />
            ))}

          {songs.map((song) => {
            const cover = songCover(song);
            const untitledDraft = song.status === "draft" && !song.key;
            return (
              <Link
                key={song.id}
                to={`/songs/${song.id}`}
                className="flex flex-col gap-[13px] rounded-card border border-border-alt bg-surface p-4 no-underline"
              >
                <CoverArt
                  variant={cover}
                  className={`flex h-[120px] rounded-[9px] p-3 ${
                    cover === "none" ? "items-center justify-center" : "items-end justify-between"
                  }`}
                >
                  {cover === "none" ? (
                    <span className="font-mono text-[11px] text-faint-2">rascunho</span>
                  ) : (
                    <>
                      <span className="font-mono text-[11px] text-[#9a8c72]">capa</span>
                      <StatusDot status={song.status} size={9} />
                    </>
                  )}
                </CoverArt>
                <div>
                  <div className={`text-[17px] font-semibold ${untitledDraft ? "text-ink-2" : "text-ink"}`}>
                    {song.title}
                  </div>
                  <div className={`mt-[3px] font-mono text-xs ${untitledDraft ? "text-faint" : "text-meta-2"}`}>
                    {song.key && song.bpm
                      ? `${song.key} · ${song.bpm} BPM · ${statusLabel[song.status]}`
                      : statusLabel[song.status]}
                  </div>
                </div>
                {song.genre && (
                  <div className="flex gap-[6px]">
                    <span className="rounded-md border border-border-strong px-2 py-[2px] text-[11px] text-meta">
                      {song.genre}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}

          {!songsQuery.isLoading && (
            <Link
              to="/songs/new"
              className="flex min-h-[218px] flex-col items-center justify-center gap-[10px] rounded-card border border-dashed border-border-dashed text-faint no-underline"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-surface-active text-accent">
                <Plus size={22} />
              </div>
              <span className="font-mono text-xs">Nova música</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
