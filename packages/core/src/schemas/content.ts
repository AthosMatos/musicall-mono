import { z } from 'zod';

/** Lyric versions (RF-12..14). */
export const lyricVersionSchema = z.object({
  id: z.string(),
  songId: z.string(),
  label: z.string(),
  content: z.string(),
  isPrimary: z.boolean(),
  createdAt: z.string().datetime(),
});
export type LyricVersion = z.infer<typeof lyricVersionSchema>;

export const createLyricVersionSchema = z.object({
  label: z.string().min(1).max(100),
  content: z.string().max(50000),
  isPrimary: z.boolean().optional(),
});
export type CreateLyricVersionInput = z.infer<typeof createLyricVersionSchema>;

export const updateLyricVersionSchema = createLyricVersionSchema.partial();
export type UpdateLyricVersionInput = z.infer<typeof updateLyricVersionSchema>;

/** Chord charts (RF-17). */
export const chordChartSchema = z.object({
  id: z.string(),
  songId: z.string(),
  label: z.string(),
  content: z.string(),
  createdAt: z.string().datetime(),
});
export type ChordChart = z.infer<typeof chordChartSchema>;

export const createChordChartSchema = z.object({
  label: z.string().min(1).max(100),
  content: z.string().max(50000),
});
export type CreateChordChartInput = z.infer<typeof createChordChartSchema>;

export const updateChordChartSchema = createChordChartSchema.partial();
export type UpdateChordChartInput = z.infer<typeof updateChordChartSchema>;

/** Tablatures (RF-18). */
export const tablatureSchema = z.object({
  id: z.string(),
  songId: z.string(),
  label: z.string(),
  content: z.string(),
  instrument: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type Tablature = z.infer<typeof tablatureSchema>;

export const createTablatureSchema = z.object({
  label: z.string().min(1).max(100),
  content: z.string().max(50000),
  instrument: z.string().max(100).optional(),
});
export type CreateTablatureInput = z.infer<typeof createTablatureSchema>;

export const updateTablatureSchema = createTablatureSchema.partial();
export type UpdateTablatureInput = z.infer<typeof updateTablatureSchema>;
