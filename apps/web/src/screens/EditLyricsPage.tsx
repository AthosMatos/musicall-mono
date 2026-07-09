import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  lyricsCreateOptions,
  lyricsListKey,
  lyricsListOptions,
  songsGetOptions,
  type LyricVersionListDto,
  type SongResponseDto,
} from "@monorepo/core/api";
import { MetaChip, MonoLabel } from "../components/primitives";
import { shortDate } from "../lib/model";

const insertableSections = ["verso", "refrão", "ponte", "pré"];

export default function EditLyricsPage() {
  const { id = "" } = useParams();
  const songQuery = useQuery({ ...songsGetOptions(id), enabled: !!id });
  const lyricsQuery = useQuery({ ...lyricsListOptions(id), enabled: !!id });

  if (songQuery.isLoading || lyricsQuery.isLoading) {
    return <div className="min-h-svh bg-bg p-10 font-mono text-sm text-faint">carregando…</div>;
  }
  if (!songQuery.data) {
    return <div className="min-h-svh bg-bg p-10 font-mono text-sm text-meta">música não encontrada</div>;
  }
  return <Editor song={songQuery.data} versions={lyricsQuery.data ?? []} />;
}

function Editor({ song, versions }: { song: SongResponseDto; versions: LyricVersionListDto }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const base = versions.find((v) => v.isPrimary) ?? versions[0];
  const [text, setText] = useState(base?.content ?? "");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const nextVersionNumber = versions.length + 1;

  const saveVersion = useMutation({
    ...lyricsCreateOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: lyricsListKey(song.id) });
      navigate(`/songs/${song.id}`);
    },
  });

  function insertSection(name: string) {
    const editor = editorRef.current;
    const marker = `\n\n[${name}]\n`;
    if (!editor) {
      setText((t) => t + marker);
      return;
    }
    const at = editor.selectionEnd ?? text.length;
    setText(text.slice(0, at) + marker + text.slice(at));
    requestAnimationFrame(() => {
      editor.focus();
      editor.selectionStart = editor.selectionEnd = at + marker.length;
    });
  }

  function save() {
    saveVersion.mutate({
      songId: song.id,
      body: { label: `v${nextVersionNumber}`, content: text, isPrimary: true },
    });
  }

  return (
    <div className="flex min-h-svh flex-col bg-bg">
      <header className="flex items-center gap-[18px] border-b border-border px-9 py-5">
        <Link to={`/songs/${song.id}`} className="text-[15px] text-ink-2 no-underline hover:text-ink">
          Cancelar
        </Link>
        <div className="flex-1 text-center">
          <span className="text-lg font-semibold text-ink">{song.title}</span>
          <span className="ml-3 font-mono text-xs text-amber">editando</span>
        </div>
        <MetaChip className="text-meta">
          v{nextVersionNumber} · nova ▾
        </MetaChip>
        <button
          type="button"
          onClick={save}
          disabled={saveVersion.isPending || !text.trim()}
          className="flex h-10 cursor-pointer items-center rounded-[11px] border-none bg-accent px-5 text-sm font-semibold text-on-accent disabled:opacity-60"
        >
          {saveVersion.isPending ? "salvando…" : "Salvar versão"}
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* editor */}
        <div className="min-w-0 flex-[1.6] px-11 py-[30px]">
          <textarea
            ref={editorRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            placeholder={"[verso 1]\nescreva a primeira linha…"}
            className="h-full w-full resize-none border-none bg-transparent font-mono text-base leading-[2.15] text-lyric outline-none placeholder:text-faint"
          />
        </div>

        {/* side: sections + versions */}
        <aside className="flex w-[320px] shrink-0 flex-col gap-[22px] border-l border-border bg-bg-deep px-6 py-[26px]">
          <section>
            <MonoLabel className="mb-3">Inserir seção</MonoLabel>
            <div className="flex flex-wrap gap-2">
              {insertableSections.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => insertSection(name)}
                  className="cursor-pointer rounded-[9px] border border-border-alt bg-surface px-[13px] py-2 font-mono text-xs text-ink-3"
                >
                  + {name}
                </button>
              ))}
            </div>
          </section>

          <section>
            <MonoLabel className="mb-3">Versões</MonoLabel>
            <div className="flex flex-col gap-2">
              <div className="flex items-center rounded-[11px] border border-border-active bg-surface-active px-[13px] py-[11px]">
                <span className="font-mono text-[13px] text-ink">v{nextVersionNumber} · editando</span>
              </div>
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center rounded-[11px] border border-border-alt bg-surface px-[13px] py-[11px]"
                >
                  <span className="font-mono text-[13px] text-ink-3">{version.label}</span>
                  {version.isPrimary ? (
                    <span className="ml-auto font-mono text-[10px] text-accent-soft">principal</span>
                  ) : (
                    <span className="ml-auto font-mono text-[11px] text-faint">
                      {shortDate(version.createdAt)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="mt-auto flex items-center gap-[7px] font-mono text-xs text-success">
            <span className="h-[6px] w-[6px] rounded-full bg-success" />
            {saveVersion.isError ? (
              <span className="text-accent-soft">erro ao salvar — tente de novo</span>
            ) : (
              "salva ao confirmar a versão"
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
