import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  collectionsGetOptions,
  collectionsListSongsKey,
  collectionsListSongsOptions,
  collectionsReorderOptions,
} from "@monorepo/core/api";
import { CoverArt, MonoLabel } from "../components/primitives";
import { ReorderableTrackList } from "../components/TrackList";
import { collectionCover, collectionStatusLabel, collectionTypeLabel } from "../lib/model";

export default function AlbumDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const albumQuery = useQuery({ ...collectionsGetOptions(id), enabled: !!id });
  const tracksQuery = useQuery({ ...collectionsListSongsOptions(id), enabled: !!id });

  const reorder = useMutation({
    ...collectionsReorderOptions(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: collectionsListSongsKey(id) }),
  });

  const album = albumQuery.data;
  const tracks = tracksQuery.data ?? [];

  if (albumQuery.isLoading) {
    return <div className="p-10 font-mono text-sm text-faint">carregando…</div>;
  }
  if (!album) {
    return <div className="p-10 font-mono text-sm text-meta">coleção não encontrada</div>;
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* album header column */}
      <div className="flex w-[340px] shrink-0 flex-col overflow-y-auto border-r border-border px-[30px] py-9">
        <Link
          to="/albums"
          className="mb-[18px] flex items-center gap-1 text-xl text-[#7a7268] no-underline hover:text-ink-2"
        >
          <ChevronLeft size={20} /> Álbuns
        </Link>
        <CoverArt variant={collectionCover(album)} className="aspect-square w-full rounded-2xl" />
        <div className="mt-5 font-mono text-[11px] tracking-[0.08em] text-amber uppercase">
          {collectionTypeLabel(album)} · {collectionStatusLabel[album.status]}
        </div>
        <h1 className="m-0 mt-[6px] text-[30px] font-semibold tracking-[-0.02em] text-ink">{album.title}</h1>
        <div className="mt-2 font-mono text-xs text-meta-2">
          {tracks.length} faixa{tracks.length === 1 ? "" : "s"}
        </div>
        {album.description && (
          <div className="mt-4 text-sm leading-[1.55] text-ink-3">{album.description}</div>
        )}
        <button
          type="button"
          className="mt-auto flex h-[46px] cursor-pointer items-center justify-center gap-[9px] rounded-xl border-none bg-accent pt-px text-sm font-semibold text-on-accent"
        >
          <Plus size={16} strokeWidth={2.5} /> Adicionar faixa
        </button>
      </div>

      {/* track list */}
      <div className="min-w-0 flex-1 overflow-y-auto p-9">
        <MonoLabel className="pb-[14px]">
          Faixas · arraste para reordenar
          {reorder.isPending && <span className="ml-2 text-amber">· salvando…</span>}
        </MonoLabel>
        {tracks.length === 0 && !tracksQuery.isLoading ? (
          <div className="flex h-[120px] items-center justify-center rounded-card border border-dashed border-border-dashed font-mono text-xs text-faint">
            nenhuma faixa ainda — adicione músicas a esta coleção
          </div>
        ) : (
          <ReorderableTrackList
            tracks={tracks}
            onReorder={(songIds) => reorder.mutate({ id, body: { songIds } })}
          />
        )}
      </div>
    </div>
  );
}
