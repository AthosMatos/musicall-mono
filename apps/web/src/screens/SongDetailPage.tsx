import { useState } from "react";
import { ChevronLeft, MoreVertical } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { LyricBody } from "../components/LyricBody";
import { PlayerCard } from "../components/Player";
import { MetaChip, MonoLabel, SavedIndicator, StatusPill } from "../components/primitives";
import { getSong, statusLabel } from "../data/songbook";

const tabs = ["Letra", "Cifra", "Tab"] as const;
type Tab = (typeof tabs)[number];

export default function SongDetailPage() {
  const { id } = useParams();
  const song = getSong(id);
  const [activeTab, setActiveTab] = useState<Tab>("Letra");
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

  if (!song) {
    return <div className="p-10 font-mono text-sm text-meta">música não encontrada</div>;
  }

  const versions = song.versions;
  const activeVersion =
    versions.find((v) => v.id === activeVersionId) ??
    versions.find((v) => v.isPrimary) ??
    versions[0];

  return (
    <div className="flex min-h-svh flex-col bg-bg">
      {/* top bar */}
      <header className="flex items-center gap-[18px] border-b border-border px-9 py-[22px]">
        <Link to="/songs" className="flex text-[#7a7268] no-underline hover:text-ink-2" aria-label="Voltar">
          <ChevronLeft size={24} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="m-0 text-[26px] font-semibold tracking-[-0.02em] text-ink">{song.title}</h1>
            <StatusPill status={song.status} label={statusLabel[song.status]} />
          </div>
          <div className="mt-[6px] flex gap-2">
            {song.key && <MetaChip>{song.key}</MetaChip>}
            {song.bpm && <MetaChip>{song.bpm} BPM</MetaChip>}
          </div>
        </div>
        <SavedIndicator label="salvo automaticamente" />
        <button type="button" className="cursor-pointer border-none bg-transparent p-0 text-[#7a7268]">
          <MoreVertical size={20} />
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* left: content */}
        <div className="flex min-w-0 flex-[1.5] flex-col border-r border-border">
          <div className="flex items-center gap-6 px-8 pt-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer border-none bg-transparent p-0 pb-3 text-sm ${
                  tab === activeTab
                    ? "-mb-px border-b-2 border-solid border-accent font-semibold text-ink"
                    : "text-[#7a7268]"
                }`}
              >
                {tab}
              </button>
            ))}
            <div className="flex-1" />
            {activeVersion && (
              <Link to={`/songs/${song.id}/edit`} className="mb-2 no-underline">
                <MetaChip className="cursor-pointer text-meta">
                  {activeVersion.label} · {activeVersion.isPrimary ? "atual" : activeVersion.dateLabel} ▾
                </MetaChip>
              </Link>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto border-t border-border px-8 py-6">
            {activeTab === "Letra" &&
              (activeVersion ? (
                <LyricBody sections={activeVersion.sections} fontSize={15} />
              ) : (
                <EmptyContent label="sem letra ainda" action="escrever letra" to={`/songs/${song.id}/edit`} />
              ))}
            {activeTab === "Cifra" &&
              (song.chordChart ? (
                <pre className="m-0 font-mono text-[15px] leading-[2.1] text-lyric">{song.chordChart}</pre>
              ) : (
                <EmptyContent label="sem cifra ainda" action="adicionar cifra" />
              ))}
            {activeTab === "Tab" &&
              (song.tablature ? (
                <pre className="m-0 font-mono text-[15px] leading-[2.1] text-lyric">{song.tablature}</pre>
              ) : (
                <EmptyContent label="sem tablatura ainda" action="adicionar tab" />
              ))}
          </div>
        </div>

        {/* right: side panel */}
        <aside className="flex w-[340px] shrink-0 flex-col gap-5 overflow-y-auto bg-bg-deep px-6 py-[22px]">
          <section>
            <MonoLabel className="mb-[11px]">Player</MonoLabel>
            {song.audio ? (
              <PlayerCard audio={song.audio} />
            ) : (
              <div className="rounded-card border border-dashed border-border-dashed p-[15px] text-center font-mono text-xs text-faint">
                sem áudio · grave uma ideia
              </div>
            )}
          </section>

          <section>
            <MonoLabel className="mb-[11px]">Versões da letra</MonoLabel>
            <div className="flex flex-col gap-2">
              {versions.length === 0 && (
                <div className="rounded-[11px] border border-dashed border-border-dashed p-[11px] text-center font-mono text-xs text-faint">
                  nenhuma versão ainda
                </div>
              )}
              {versions.map((version) => {
                const selected = version.id === activeVersion?.id;
                return (
                  <button
                    key={version.id}
                    type="button"
                    onClick={() => setActiveVersionId(version.id)}
                    className={`flex cursor-pointer items-center gap-[10px] rounded-[11px] border px-[13px] py-[11px] text-left ${
                      selected
                        ? "border-border-active bg-surface-active"
                        : "border-border-alt bg-surface"
                    }`}
                  >
                    <span className={`font-mono text-[13px] ${selected ? "text-ink" : "text-ink-3"}`}>
                      {version.label}
                      {version.isPrimary ? " · atual" : ""}
                    </span>
                    {version.isPrimary ? (
                      <span className="ml-auto font-mono text-[10px] text-accent-soft">principal</span>
                    ) : (
                      <span className="ml-auto font-mono text-[11px] text-faint">{version.dateLabel}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <MonoLabel className="mb-[11px]">Tags</MonoLabel>
            <div className="flex flex-wrap gap-[7px]">
              {song.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-border-alt bg-surface px-[11px] py-[5px] text-xs text-ink-3"
                >
                  {tag}
                </span>
              ))}
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-dashed border-border-dashed bg-transparent px-[11px] py-[5px] text-xs text-faint"
              >
                + tag
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function EmptyContent({ label, action, to }: { label: string; action: string; to?: string }) {
  const button = (
    <span className="rounded-lg border border-border-strong bg-surface-alt px-[13px] py-2 font-mono text-xs text-ink-3">
      + {action}
    </span>
  );
  return (
    <div className="flex flex-col items-start gap-3 pt-2">
      <span className="font-mono text-sm text-faint">{label}</span>
      {to ? (
        <Link to={to} className="no-underline">
          {button}
        </Link>
      ) : (
        button
      )}
    </div>
  );
}
