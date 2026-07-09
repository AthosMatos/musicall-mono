import type { CollectionStatus, CollectionType, SongStatus } from "@monorepo/core";

// Presentation helpers mapping API DTOs to what the screens render. Parameters
// are structural because the codegen types list items as string unions but
// single responses as TS enums — both satisfy these shapes.

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

export const statusLabel: Record<SongStatus, string> = {
  draft: "rascunho",
  in_progress: "em progresso",
  finished: "finalizada",
};

export const collectionStatusLabel: Record<CollectionStatus, string> = {
  draft: "rascunho",
  in_progress: "em progresso",
  released: "finalizado",
};

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
export function collectionTypeLabel(collection: CollectionLike): string {
  return collection.type === "single" ? "single" : "EP";
}

/** "Lá · 92 BPM", falling back to the status for metadata-less drafts. */
export function songMeta(song: SongLike): string {
  if (song.key && song.bpm) return `${song.key} · ${song.bpm} BPM`;
  if (song.key) return song.key;
  if (song.bpm) return `${song.bpm} BPM`;
  return statusLabel[song.status];
}

const monthsPt = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "12 mar" */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${monthsPt[d.getMonth()]}`;
}

/** "terça · 23 jun" */
export function todayLabel(): string {
  const now = new Date();
  const weekday = now.toLocaleDateString("pt-BR", { weekday: "long" }).split("-")[0];
  return `${weekday} · ${now.getDate()} ${monthsPt[now.getMonth()]}`;
}

/** "2:34" from seconds. */
export function formatDuration(seconds: number | null): string | null {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Decorative waveform bars (the API stores no waveform data). */
export function waveformSamples(seed: string, count = 14): number[] {
  const samples: number[] = [];
  let h = hash(seed) || 1;
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    samples.push(30 + (h % 71));
  }
  return samples;
}
