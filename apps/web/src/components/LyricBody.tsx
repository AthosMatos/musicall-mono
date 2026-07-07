import type { LyricSection } from "../data/songbook";

function sectionColor(label: string): string {
  return label.startsWith("refrão") ? "var(--color-amber)" : "var(--color-accent)";
}

/** Mono lyric rendering with [seção] labels (frames 2, 4, 12, 14). */
export function LyricBody({
  sections,
  fontSize = 15,
  cursor = false,
}: {
  sections: LyricSection[];
  fontSize?: number;
  /** show a blinking caret at the end of the last line (editor screens) */
  cursor?: boolean;
}) {
  return (
    <div className="font-mono text-lyric" style={{ fontSize, lineHeight: 2.1 }}>
      {sections.map((section, si) => (
        <div key={si} className={si > 0 ? "pt-[22px]" : undefined}>
          <div
            className="mb-2 text-[11px] tracking-[0.12em] uppercase"
            style={{ color: sectionColor(section.label), lineHeight: 1.4 }}
          >
            [{section.label}]
          </div>
          {section.lines.map((line, li) => {
            const isLast = cursor && si === sections.length - 1 && li === section.lines.length - 1;
            return (
              <div key={li}>
                {line}
                {isLast && (
                  <span
                    className="ml-[1px] inline-block w-[2px] animate-pulse bg-accent align-[-3px]"
                    style={{ height: fontSize * 1.3 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
