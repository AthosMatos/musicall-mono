import { parseLyricSections } from "@monorepo/core";

function sectionColor(label: string): string {
  return label.toLowerCase().startsWith("refrão") ? "var(--color-amber)" : "var(--color-accent)";
}

/** Mono lyric rendering with [seção] labels (frames 2, 4, 12, 14). */
export function LyricBody({
  content,
  fontSize = 15,
}: {
  /** Raw lyric text with `[marker]` section lines (core parses it). */
  content: string;
  fontSize?: number;
}) {
  const sections = parseLyricSections(content);
  return (
    <div className="font-mono text-lyric" style={{ fontSize, lineHeight: 2.1 }}>
      {sections.map((section, si) => (
        <div key={si} className={si > 0 ? "pt-[22px]" : undefined}>
          {section.label && (
            <div
              className="mb-2 text-[11px] tracking-[0.12em] uppercase"
              style={{ color: sectionColor(section.label), lineHeight: 1.4 }}
            >
              [{section.label}]
            </div>
          )}
          {section.content.split("\n").map((line, li) => (
            <div key={li}>{line || " "}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
