/**
 * Lyric section markers (RF-16). Sections are marked with simple text markers
 * on their own line, e.g.:
 *
 *   [Verse 1]
 *   first line...
 *
 *   [Chorus]
 *   ...
 *
 * This is a pure, platform-agnostic parser shared by web and mobile editors.
 */

export interface LyricSection {
  /** The marker label without brackets, e.g. "Verse 1". Null for content before the first marker. */
  label: string | null;
  /** The lines belonging to this section (excluding the marker line). */
  content: string;
}

const MARKER = /^\s*\[(.+?)\]\s*$/;

/** Split raw lyric content into ordered sections by `[marker]` lines. */
export function parseLyricSections(content: string): LyricSection[] {
  const sections: LyricSection[] = [];
  let current: LyricSection = { label: null, content: '' };
  const buffer: string[] = [];

  const flush = () => {
    current.content = buffer.join('\n').trim();
    if (current.label !== null || current.content.length > 0) {
      sections.push(current);
    }
    buffer.length = 0;
  };

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(MARKER);
    if (match) {
      flush();
      current = { label: match[1].trim(), content: '' };
    } else {
      buffer.push(line);
    }
  }
  flush();

  return sections;
}
