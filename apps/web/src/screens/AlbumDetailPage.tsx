import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  collectionsAddSongOptions,
  collectionsGetOptions,
  collectionsListSongsKey,
  collectionsListSongsOptions,
  collectionsRemoveOptions,
  collectionsReorderOptions,
  collectionsSearchKey,
  collectionsUpdateOptions,
} from "@monorepo/core/api";
import { MonoLabel } from "../components/primitives";
import { CollectionCover } from "../components/CollectionCover";
import { ReorderableTrackList } from "../components/TrackList";
import { collectionStatusLabel, collectionTypeLabel } from "../lib/model";
import { uploadCollectionCover } from "../lib/media";
import { AddTrackDialog } from "../components/AddTrackDialog";
import { EditCollectionDialog } from "../components/EditCollectionDialog";

export default function AlbumDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const albumQuery = useQuery({ ...collectionsGetOptions(id), enabled: !!id });
  const tracksQuery = useQuery({ ...collectionsListSongsOptions(id), enabled: !!id });

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const invalidateTracks = () =>
    queryClient.invalidateQueries({ queryKey: collectionsListSongsKey(id) });

  const invalidateCollections = () =>
    queryClient.invalidateQueries({ queryKey: collectionsSearchKey().slice(0, 1) });

  const reorder = useMutation({
    ...collectionsReorderOptions(),
    onSettled: invalidateTracks,
  });

  const addSong = useMutation({
    ...collectionsAddSongOptions(),
    onSuccess: invalidateTracks,
  });

  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const updateAlbum = useMutation({
    ...collectionsUpdateOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionsGetOptions(id).queryKey });
      invalidateCollections();
      setEditOpen(false);
    },
  });

  // Cover upload (presign → PUT → confirm) runs before the collection update so
  // the new coverMediaId is persisted in the same save action.
  async function handleEditSave(title: string, description: string, coverFile: File | null) {
    setIsSavingEdit(true);
    try {
      const coverMediaId = coverFile ? await uploadCollectionCover(id, coverFile) : undefined;
      await updateAlbum.mutateAsync({
        id,
        body: {
          title,
          description: description || undefined,
          ...(coverMediaId ? { coverMediaId } : {}),
        },
      });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "erro ao salvar a coleção");
    } finally {
      setIsSavingEdit(false);
    }
  }

  const removeAlbum = useMutation({
    ...collectionsRemoveOptions(),
    onSuccess: () => {
      invalidateCollections();
      navigate("/albums");
    },
  });

  const confirmDelete = () => {
    if (!window.confirm("Excluir esta coleção? As faixas não serão apagadas.")) return;
    setMenuOpen(false);
    removeAlbum.mutate({ id });
  };

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
        <div className="mb-[18px] flex items-center justify-between">
          <Link
            to="/albums"
            className="flex items-center gap-1 text-xl text-[#7a7268] no-underline hover:text-ink-2"
          >
            <ChevronLeft size={20} /> Álbuns
          </Link>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Mais opções"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex cursor-pointer border-none bg-transparent p-0 text-[#7a7268] hover:text-ink-2"
            >
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[180px] overflow-hidden rounded-xl border border-border-alt bg-bg py-1 shadow-drag">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setEditOpen(true);
                  }}
                  className="flex w-full cursor-pointer items-center gap-[10px] border-none bg-transparent px-4 py-[10px] text-left text-sm text-ink-3 hover:bg-surface-active hover:text-ink"
                >
                  <Pencil size={15} /> Editar
                </button>
                <button
                  type="button"
                  disabled={removeAlbum.isPending}
                  onClick={confirmDelete}
                  className="flex w-full cursor-pointer items-center gap-[10px] border-none bg-transparent px-4 py-[10px] text-left text-sm text-accent-soft hover:bg-surface-active disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={15} /> Excluir
                </button>
              </div>
            )}
          </div>
        </div>
        <CollectionCover collection={album} className="aspect-square w-full rounded-2xl" />
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
          onClick={() => setAddOpen(true)}
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

      <AddTrackDialog
        open={addOpen}
        existingIds={tracks.map((t) => t.id)}
        isAdding={addSong.isPending}
        onClose={() => setAddOpen(false)}
        onAdd={(songId) =>
          addSong.mutate(
            { id, body: { songId } },
            { onSuccess: () => setAddOpen(false) },
          )
        }
      />

      <EditCollectionDialog
        open={editOpen}
        collection={album}
        title={album.title}
        description={album.description ?? ""}
        isSaving={isSavingEdit}
        onClose={() => setEditOpen(false)}
        onSave={handleEditSave}
      />
    </div>
  );
}
