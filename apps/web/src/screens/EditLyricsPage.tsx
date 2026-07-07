import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MetaChip, MonoLabel } from "../components/primitives";
import { getSong, primaryVersion, type LyricSection } from "../data/songbook";

function sectionsToText(sections: LyricSection[]): string {
  return sections
    .map((s) => [`[${s.label}]`, ...s.lines].join("\n"))
    .join("\n\n");
}

const insertableSections = ["verso", "refrão", "ponte", "pré"];

export default function EditLyricsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const song = getSong(id);
  const base = song ? primaryVersion(song) : undefined;
  const [text, setText] = useState(() => (base ? sectionsToText(base.sections) : ""));
  const editorRef = useRef<HTMLTextAreaElement>(null);

  if (!song) {
    return <div className="p-10 font-mono text-sm text-meta">música não encontrada</div>;
  }

  const nextVersionNumber = song.versions.length + 1;

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
          onClick={() => navigate(`/songs/${song.id}`)}
          className="flex h-10 cursor-pointer items-center rounded-[11px] border-none bg-accent px-5 text-sm font-semibold text-on-accent"
        >
          Salvar versão
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
              {song.versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center rounded-[11px] border border-border-alt bg-surface px-[13px] py-[11px]"
                >
                  <span className="font-mono text-[13px] text-ink-3">{version.label}</span>
                  {version.isPrimary ? (
                    <span className="ml-auto font-mono text-[10px] text-accent-soft">principal</span>
                  ) : (
                    <span className="ml-auto font-mono text-[11px] text-faint">{version.dateLabel}</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="mt-auto flex items-center gap-[7px] font-mono text-xs text-success">
            <span className="h-[6px] w-[6px] rounded-full bg-success" />
            salvo automaticamente · 14:32
          </div>
        </aside>
      </div>
    </div>
  );
}
