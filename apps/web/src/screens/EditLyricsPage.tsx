import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  lyricsCreateOptions,
  lyricsListKey,
  lyricsListOptions,
  lyricsUpdateOptions,
  songsGetOptions,
  type LyricVersionListDto,
  type LyricVersionResponseDto,
  type SongResponseDto,
} from "@monorepo/core/api";
import { MonoLabel } from "../components/primitives";
import { shortDate } from "../lib/model";

const insertableSections = ["verso", "refrão", "ponte", "pré"];

export default function EditLyricsPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const songQuery = useQuery({ ...songsGetOptions(id), enabled: !!id });
  const lyricsQuery = useQuery({ ...lyricsListOptions(id), enabled: !!id });

  if (songQuery.isLoading || lyricsQuery.isLoading) {
    return <div className="min-h-svh bg-bg p-10 font-mono text-sm text-faint">carregando…</div>;
  }
  if (!songQuery.data) {
    return <div className="min-h-svh bg-bg p-10 font-mono text-sm text-meta">música não encontrada</div>;
  }

  const versions = lyricsQuery.data ?? [];
  const wantNew = searchParams.get("new") === "1";
  const versionParam = searchParams.get("version");
  // Which version we're editing. `undefined` → create-a-new-version mode. This
  // happens when ?new=1 is passed, or when the song has no versions yet.
  const editing = wantNew
    ? undefined
    : versions.find((v) => v.id === versionParam) ??
      versions.find((v) => v.isPrimary) ??
      versions[0];

  return <Editor song={songQuery.data} versions={versions} editing={editing} />;
}

function Editor({
  song,
  versions,
  editing,
}: {
  song: SongResponseDto;
  versions: LyricVersionListDto;
  editing: LyricVersionResponseDto | undefined;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !editing;
  const [text, setText] = useState(editing?.content ?? "");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const nextVersionNumber = versions.length + 1;
  const [label, setLabel] = useState(editing?.label ?? `v${nextVersionNumber}`);
  const trimmedLabel = label.trim();

  const onSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: lyricsListKey(song.id) });
    navigate(`/songs/${song.id}`);
  };
  const createVersion = useMutation({ ...lyricsCreateOptions(), onSuccess: onSaved });
  const updateVersion = useMutation({ ...lyricsUpdateOptions(), onSuccess: onSaved });
  const saving = createVersion.isPending || updateVersion.isPending;
  const saveError = createVersion.isError || updateVersion.isError;

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
    const finalLabel = trimmedLabel || `v${nextVersionNumber}`;
    if (editing) {
      updateVersion.mutate({
        songId: song.id,
        id: editing.id,
        body: { label: finalLabel, content: text },
      });
    } else {
      createVersion.mutate({
        songId: song.id,
        body: { label: finalLabel, content: text, isPrimary: true },
      });
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-bg">
      <header className="flex items-center gap-[18px] border-b border-border px-9 py-5">
        <Link to={`/songs/${song.id}`} className="text-[15px] text-ink-2 no-underline hover:text-ink">
          Cancelar
        </Link>
        <div className="flex-1 text-center">
          <span className="text-lg font-semibold text-ink">{song.title}</span>
          <span className="ml-3 font-mono text-xs text-amber">
            {isNew ? "nova versão" : "editando"}
          </span>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface-alt px-[11px] py-[5px] font-mono text-xs focus-within:border-border-active">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={`v${nextVersionNumber}`}
            aria-label="Título da versão"
            maxLength={100}
            className="w-[90px] border-none bg-transparent text-ink outline-none placeholder:text-faint"
          />
          <span className="text-faint">{isNew ? "· nova" : "· atual"}</span>
        </label>
        <button
          type="button"
          onClick={save}
          disabled={saving || !text.trim()}
          className="flex h-10 cursor-pointer items-center rounded-[11px] border-none bg-accent px-5 text-sm font-semibold text-on-accent disabled:opacity-60"
        >
          {saving ? "salvando…" : isNew ? "Salvar versão" : "Salvar"}
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
              {isNew && (
                <div className="flex items-center rounded-[11px] border border-border-active bg-surface-active px-[13px] py-[11px]">
                  <span className="font-mono text-[13px] text-ink">
                    {trimmedLabel || `v${nextVersionNumber}`} · editando
                  </span>
                </div>
              )}
              {versions.map((version) => {
                const active = editing?.id === version.id;
                return (
                  <div
                    key={version.id}
                    className={`flex items-center rounded-[11px] border px-[13px] py-[11px] ${
                      active ? "border-border-active bg-surface-active" : "border-border-alt bg-surface"
                    }`}
                  >
                    <span className={`font-mono text-[13px] ${active ? "text-ink" : "text-ink-3"}`}>
                      {active ? trimmedLabel || version.label : version.label}
                      {active ? " · editando" : ""}
                    </span>
                    {active ? (
                      <span className="ml-auto font-mono text-[10px] text-amber">editando</span>
                    ) : version.isPrimary ? (
                      <span className="ml-auto font-mono text-[10px] text-accent-soft">principal</span>
                    ) : (
                      <span className="ml-auto font-mono text-[11px] text-faint">
                        {shortDate(version.createdAt)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="mt-auto flex items-center gap-[7px] font-mono text-xs text-success">
            <span className="h-[6px] w-[6px] rounded-full bg-success" />
            {saveError ? (
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
