import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Mic, PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  collectionsAddSong,
  collectionsSearchOptions,
  songsCreateOptions,
} from "@monorepo/core/api";
import { MonoLabel } from "../components/primitives";

const startOptions = [
  { id: "lyrics", icon: PenLine, title: "Letra em branco", subtitle: "editor mono" },
  { id: "record", icon: Mic, title: "Gravar áudio", subtitle: "captura rápida" },
  { id: "import", icon: FileUp, title: "Importar arquivo", subtitle: "áudio ou texto" },
] as const;

const keys = ["Dó", "Ré", "Mi", "Fá", "Sol", "Lá", "Si"];

export default function CreateSongPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [songKey, setSongKey] = useState("");
  const [bpm, setBpm] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [startWith, setStartWith] = useState<(typeof startOptions)[number]["id"]>("lyrics");

  const albumsQuery = useQuery(collectionsSearchOptions({ pageSize: 40 }));
  const albums = albumsQuery.data?.items ?? [];

  const createSong = useMutation({
    ...songsCreateOptions(),
    onSuccess: async (song) => {
      if (albumId) {
        try {
          await collectionsAddSong(albumId, { songId: song.id });
        } catch {
          // song exists either way; the album can be fixed later
        }
      }
      await queryClient.invalidateQueries();
      navigate(startWith === "lyrics" ? `/songs/${song.id}/edit` : `/songs/${song.id}`, {
        replace: true,
      });
    },
  });

  function submit() {
    if (!title.trim() || createSong.isPending) return;
    createSong.mutate({
      body: {
        title: title.trim(),
        key: songKey || undefined,
        bpm: bpm ? Number(bpm) : undefined,
      },
    });
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-bg">
      <div className="w-[760px] max-w-[92vw]">
        <div className="mb-3 font-mono text-xs tracking-[0.08em] text-amber uppercase">Nova música</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da música"
          autoFocus
          className="w-full border-0 border-b border-solid border-border-strong bg-transparent pt-2 pb-[14px] font-ui text-[38px] font-semibold tracking-[-0.02em] text-ink outline-none placeholder:text-faint"
        />

        <div className="mt-6 flex gap-[14px]">
          <label className="min-w-0 flex-1">
            <MonoLabel className="mb-2">Tom</MonoLabel>
            <select
              value={songKey}
              onChange={(e) => setSongKey(e.target.value)}
              className={`h-[46px] w-full cursor-pointer appearance-none rounded-[11px] border border-border-strong bg-surface-alt px-[15px] font-mono text-sm outline-none ${songKey ? "text-ink" : "text-meta"}`}
            >
              <option value="">selecionar ▾</option>
              {keys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0 flex-1">
            <MonoLabel className="mb-2">BPM</MonoLabel>
            <input
              value={bpm}
              onChange={(e) => setBpm(e.target.value.replace(/\D/g, ""))}
              placeholder="—"
              inputMode="numeric"
              className="h-[46px] w-full rounded-[11px] border border-border-strong bg-surface-alt px-[15px] font-mono text-sm text-ink outline-none placeholder:text-meta"
            />
          </label>
          <label className="min-w-0 flex-[1.3]">
            <MonoLabel className="mb-2">Adicionar a</MonoLabel>
            <select
              value={albumId}
              onChange={(e) => setAlbumId(e.target.value)}
              className={`h-[46px] w-full cursor-pointer appearance-none rounded-[11px] border border-border-strong bg-surface-alt px-[15px] font-mono text-sm outline-none ${albumId ? "text-ink" : "text-meta"}`}
            >
              <option value="">nenhum álbum ▾</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <MonoLabel className="mt-6 mb-[10px]">Começar por</MonoLabel>
        <div className="grid grid-cols-3 gap-[14px]">
          {startOptions.map(({ id, icon: Icon, title: optionTitle, subtitle }) => {
            const selected = startWith === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setStartWith(id)}
                className={`cursor-pointer rounded-card border p-[18px] pt-5 text-left ${
                  selected ? "border-border-active bg-surface-active" : "border-border-alt bg-surface"
                }`}
              >
                <Icon size={22} className={`mb-[10px] ${selected ? "text-accent" : "text-ink-3"}`} />
                <div className="text-base font-semibold text-ink">{optionTitle}</div>
                <div className="mt-1 font-mono text-xs text-meta-2">{subtitle}</div>
              </button>
            );
          })}
        </div>

        {createSong.isError && (
          <div className="mt-5 rounded-[10px] border border-[rgba(194,94,68,.35)] bg-[rgba(194,94,68,.1)] px-[13px] py-[10px] font-mono text-xs text-accent-soft">
            não foi possível criar a música — tente de novo
          </div>
        )}

        <div className="mt-[30px] flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-[46px] cursor-pointer items-center rounded-xl border border-border-strong bg-surface-alt px-[22px] text-sm text-ink-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim() || createSong.isPending}
            className="flex h-[46px] cursor-pointer items-center rounded-xl border-none bg-accent px-[26px] text-sm font-semibold text-on-accent disabled:opacity-60"
          >
            {createSong.isPending ? "criando…" : "Criar música"}
          </button>
        </div>
      </div>
    </div>
  );
}
