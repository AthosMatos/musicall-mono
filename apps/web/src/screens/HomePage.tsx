import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Play, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { collectionsSearchOptions, songsSearchOptions } from "@monorepo/core/api";
import { CoverArt, StatusDot } from "../components/primitives";
import { useAuth } from "../lib/auth";
import { collectionCover, collectionTypeLabel, songCover, songMeta, todayLabel } from "../lib/model";

function SeeAll({ to }: { to: string }) {
  return (
    <Link to={to} className="flex items-center gap-1 font-mono text-xs text-meta-2 no-underline hover:text-ink-3">
      ver tudo <ChevronRight size={12} />
    </Link>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const recentsQuery = useQuery(songsSearchOptions({ sort: "updatedAt", order: "desc", pageSize: 4 }));
  const albumsQuery = useQuery(collectionsSearchOptions({ pageSize: 8 }));

  const recents = recentsQuery.data?.items ?? [];
  const albums = albumsQuery.data?.items ?? [];
  const continueSong = recents.find((s) => s.status === "in_progress") ?? recents[0];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-10">
      <header className="flex items-start justify-between px-10 pt-[30px] pb-2">
        <div>
          <div className="font-mono text-xs text-meta-2">{todayLabel()}</div>
          <h1 className="m-0 mt-[5px] text-[32px] font-semibold tracking-[-0.02em] text-ink">
            Olá, {user?.name ?? "…"}
          </h1>
        </div>
        <Link
          to="/songs/new"
          className="flex h-11 items-center gap-2 rounded-xl bg-accent px-[18px] text-sm font-semibold text-on-accent no-underline"
        >
          <Plus size={16} strokeWidth={2.5} /> Nova música
        </Link>
      </header>

      {/* continue where you left off */}
      {continueSong && (
        <div className="px-10 pt-[18px]">
          <button
            type="button"
            onClick={() => navigate(`/songs/${continueSong.id}`)}
            className="flex w-full cursor-pointer items-center gap-[18px] rounded-2xl border border-border-active px-[22px] py-[18px] text-left"
            style={{ background: "linear-gradient(135deg,#2a2014,#221b12)" }}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
              <Play size={18} fill="currentColor" strokeWidth={0} />
            </span>
            <div className="flex-1">
              <div className="font-mono text-[11px] tracking-[0.08em] text-amber uppercase">
                continuar onde parou
              </div>
              <div className="mt-[2px] text-[19px] font-semibold text-ink">{continueSong.title}</div>
            </div>
            <span className="font-mono text-xs text-meta-2">{songMeta(continueSong)}</span>
          </button>
        </div>
      )}

      {/* recentes */}
      <div className="flex items-baseline justify-between px-10 pt-[30px] pb-[14px]">
        <h2 className="m-0 text-xl font-semibold text-ink">Recentes</h2>
        <SeeAll to="/songs" />
      </div>
      {recents.length === 0 && !recentsQuery.isLoading ? (
        <div className="px-10">
          <Link
            to="/songs/new"
            className="flex h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-dashed font-mono text-xs text-faint no-underline"
          >
            <span className="text-accent">+</span> sua primeira música começa aqui
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-[18px] px-10">
          {recents.map((song) => {
            const cover = songCover(song);
            const untitledDraft = song.status === "draft" && !song.key;
            return (
              <Link key={song.id} to={`/songs/${song.id}`} className="no-underline">
                <CoverArt
                  variant={cover}
                  className="relative flex h-[120px] items-center justify-center rounded-xl"
                >
                  {cover === "none" ? (
                    <span className="font-mono text-[11px] text-faint-2">rascunho</span>
                  ) : (
                    <span className="absolute top-[10px] right-[10px]">
                      <StatusDot status={song.status} />
                    </span>
                  )}
                </CoverArt>
                <div className={`mt-[9px] text-[15px] font-semibold ${untitledDraft ? "text-ink-2" : "text-ink"}`}>
                  {song.title}
                </div>
                <div className={`mt-[2px] font-mono text-[11px] ${untitledDraft ? "text-faint" : "text-meta-2"}`}>
                  {songMeta(song)}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* álbuns */}
      <div className="flex items-baseline justify-between px-10 pt-[30px] pb-[14px]">
        <h2 className="m-0 text-xl font-semibold text-ink">Álbuns</h2>
        <SeeAll to="/albums" />
      </div>
      <div className="flex flex-wrap gap-5 px-10">
        {albums.length === 0 && !albumsQuery.isLoading && (
          <span className="font-mono text-xs text-faint">nenhuma coleção ainda</span>
        )}
        {albums.map((album) => (
          <Link key={album.id} to={`/albums/${album.id}`} className="flex items-center gap-[14px] no-underline">
            <CoverArt variant={collectionCover(album)} className="h-[62px] w-[62px] rounded-xl" />
            <div>
              <div className="text-base font-semibold text-ink">
                {album.type === "album" ? `${album.title} · ${collectionTypeLabel(album)}` : album.title}
              </div>
              <div className="mt-[2px] font-mono text-xs text-meta-2">
                {album.type === "single" ? "single" : "álbum"}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
