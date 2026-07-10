import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import {
  collectionsCreateOptions,
  collectionsSearchKey,
  collectionsSearchOptions,
  CreateCollectionDto,
} from "@monorepo/core/api";
import { CollectionCover } from "../components/CollectionCover";
import { collectionStatusLabel, collectionTypeLabel } from "../lib/model";

const coverLabelColor: Record<string, string> = {
  EP: "#caa988",
  single: "#8fae97",
};

export default function AlbumsPage() {
  const queryClient = useQueryClient();
  const albumsQuery = useQuery(collectionsSearchOptions({ pageSize: 40 }));
  const albums = albumsQuery.data?.items ?? [];

  const createAlbum = useMutation({
    ...collectionsCreateOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: collectionsSearchKey().slice(0, 1) }),
  });

  function newAlbum() {
    const title = window.prompt("Nome do álbum:");
    if (!title?.trim()) return;
    createAlbum.mutate({ body: { type: CreateCollectionDto.type.ALBUM, title: title.trim() } });
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-10 pt-[30px] pb-[22px]">
        <div>
          <h1 className="m-0 text-[30px] font-semibold tracking-[-0.02em] text-ink">Álbuns</h1>
          <div className="mt-[3px] font-mono text-xs text-meta-2">
            {albumsQuery.isLoading
              ? "carregando…"
              : `${albums.length} coleç${albums.length === 1 ? "ão" : "ões"}`}
          </div>
        </div>
        <button
          type="button"
          onClick={newAlbum}
          disabled={createAlbum.isPending}
          className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border-none bg-accent px-[18px] text-sm font-semibold text-on-accent disabled:opacity-60"
        >
          <Plus size={16} strokeWidth={2.5} /> Novo álbum
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-10 pt-7">
        <div className="grid grid-cols-4 gap-6">
          {albumsQuery.isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-card border border-border-alt bg-surface" />
            ))}

          {albums.map((album) => {
            const typeLabel = collectionTypeLabel(album);
            return (
              <Link key={album.id} to={`/albums/${album.id}`} className="no-underline">
                <CollectionCover
                  collection={album}
                  className="flex aspect-square items-end rounded-card p-[14px]"
                >
                  <span
                    className="font-mono text-[11px]"
                    style={{ color: coverLabelColor[typeLabel] ?? "#8a8276" }}
                  >
                    {typeLabel}
                  </span>
                </CollectionCover>
                <div className="mt-[11px] text-[17px] font-semibold text-ink">{album.title}</div>
                <div className="mt-[2px] font-mono text-xs text-meta-2">
                  {album.type === "single" ? "single" : "álbum"} · {collectionStatusLabel[album.status]}
                </div>
              </Link>
            );
          })}

          {!albumsQuery.isLoading && (
            <button
              type="button"
              onClick={newAlbum}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-[10px] rounded-card border border-dashed border-border-dashed bg-transparent text-faint"
            >
              <Plus size={26} className="text-accent" />
              <span className="font-mono text-xs">Novo álbum</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
