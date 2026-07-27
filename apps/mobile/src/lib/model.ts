import type { CollectionStatus, CollectionType, SongStatus } from "@monorepo/core";
import type { TFunction } from "i18next";

// Presentation helpers mapping stored records to what the screens render.
// Parameters are structural so both Realm objects and plain literals fit.

export type CoverVariant = "warm" | "neutral" | "terracotta" | "sage" | "demos" | "none";

export interface SongLike {
  id: string;
  status: SongStatus;
  key: string | null;
  bpm: number | null;
}

export interface CollectionLike {
  id: string;
  type: CollectionType;
}

export function songStatusLabel(status: SongStatus, t: TFunction): string {
  return t(`status.song.${status}`);
}

export function collectionStatusLabel(status: CollectionStatus, t: TFunction): string {
  return t(`status.collection.${status}`);
}

const songVariants: CoverVariant[] = ["warm", "neutral", "terracotta", "sage"];
const collectionVariants: CoverVariant[] = ["terracotta", "demos", "sage", "warm"];

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic placeholder gradient until real cover art (coverMediaId) is wired. */
export function songCover(song: SongLike): CoverVariant {
  if (song.status === "draft") return "none";
  return songVariants[hash(song.id) % songVariants.length];
}

export function collectionCover(collection: CollectionLike): CoverVariant {
  return collectionVariants[hash(collection.id) % collectionVariants.length];
}

/** "EP" for multi-track albums, "single" for singles — cover corner label. */
export function collectionTypeLabel(collection: CollectionLike, t: TFunction): string {
  return collection.type === "single" ? t("collectionType.single") : t("collectionType.albumShort");
}

/** The long form used in list subtitles: "album" / "single". */
export function collectionTypeName(collection: CollectionLike, t: TFunction): string {
  return t(`collectionType.${collection.type}`);
}

/** "Lá · 92 BPM", falling back to the status for metadata-less drafts. */
export function songMeta(song: SongLike, t: TFunction): string {
  if (song.key && song.bpm) return `${song.key} · ${song.bpm} BPM`;
  if (song.key) return song.key;
  if (song.bpm) return `${song.bpm} BPM`;
  return songStatusLabel(song.status, t);
}

/** "23 de jun" (pt-BR) / "Jun 23" (en-US). */
export function shortDate(date: Date, locale: string): string {
  return date
    .toLocaleDateString(locale, { day: "numeric", month: "short" })
    .replace(/\.$/, "");
}

/** "terça · 23 de jun" / "Tuesday · Jun 23" */
export function todayLabel(locale: string): string {
  const now = new Date();
  // pt-BR renders "terça-feira"; the design only wants the first word.
  const weekday = now.toLocaleDateString(locale, { weekday: "long" }).split("-")[0];
  return `${weekday} · ${shortDate(now, locale)}`;
}

/** "2:34" from seconds. */
export function formatDuration(seconds: number | null): string | null {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Decorative waveform bars (no waveform data is stored). */
export function waveformSamples(seed: string, count = 14): number[] {
  const samples: number[] = [];
  let h = hash(seed) || 1;
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    samples.push(30 + (h % 71));
  }
  return samples;
}
