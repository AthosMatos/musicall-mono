import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { CoverArt, StatusDot, TagChip } from "../components/primitives";
import { songs, statusLabel } from "../data/songbook";

export default function SongsPage({ favoritesOnly = false }: { favoritesOnly?: boolean }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    let list = [...songs].sort((a, b) => a.updatedAtRank - b.updatedAtRank);
    if (favoritesOnly) list = list.filter((s) => s.isFavorite);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) => s.title.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [favoritesOnly, query]);

  return (
    <>
      <header className="flex items-center gap-5 border-b border-border px-9 pt-[26px] pb-[18px]">
        <div className="flex-1">
          <h1 className="m-0 text-[30px] font-semibold tracking-[-0.02em] text-ink">
            {favoritesOnly ? "Favoritas" : "Todas as músicas"}
          </h1>
          <div className="mt-[3px] font-mono text-xs text-meta-2">
            {visible.length} música{visible.length === 1 ? "" : "s"} · ordenar por: editadas recentemente ▾
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
        <div className="grid grid-cols-3 gap-5">
          {visible.map((song) => {
            const untitledDraft = song.status === "draft" && !song.key;
            return (
              <Link
                key={song.id}
                to={`/songs/${song.id}`}
                className="flex flex-col gap-[13px] rounded-card border border-border-alt bg-surface p-4 no-underline"
              >
                <CoverArt
                  variant={song.cover}
                  className={`flex h-[120px] rounded-[9px] p-3 ${
                    song.cover === "none"
                      ? "items-center justify-center"
                      : "items-end justify-between"
                  }`}
                >
                  {song.cover === "none" ? (
                    <span className="font-mono text-[11px] text-faint-2">
                      {song.audio ? `só áudio · ${song.audio.durationLabel}` : "sem capa"}
                    </span>
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
                    {untitledDraft
                      ? statusLabel[song.status]
                      : `${song.key} · ${song.bpm} BPM · ${statusLabel[song.status]}`}
                  </div>
                </div>
                {song.tags.length > 0 && (
                  <div className="flex gap-[6px]">
                    {song.tags.map((tag) => (
                      <TagChip key={tag}>{tag}</TagChip>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}

          <Link
            to="/songs/new"
            className="flex min-h-[218px] flex-col items-center justify-center gap-[10px] rounded-card border border-dashed border-border-dashed text-faint no-underline"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-surface-active text-accent">
              <Plus size={22} />
            </div>
            <span className="font-mono text-xs">Nova música</span>
          </Link>
        </div>
      </div>
    </>
  );
}
