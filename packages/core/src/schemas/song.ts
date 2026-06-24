import { z } from 'zod';
import {
  songStatusValues,
  type SongStatus,
} from '../domain/status.js';

const statusEnum = z.enum(
  songStatusValues as [SongStatus, ...SongStatus[]],
);

export const songSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: statusEnum,
  key: z.string().nullable(),
  bpm: z.number().int().positive().nullable(),
  timeSignature: z.string().nullable(),
  genre: z.string().nullable(),
  notes: z.string().nullable(),
  isFavorite: z.boolean(),
  coverMediaId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});
export type Song = z.infer<typeof songSchema>;

export const createSongSchema = z.object({
  title: z.string().min(1).max(200),
  status: statusEnum.default('draft'),
  key: z.string().max(20).optional(),
  bpm: z.number().int().positive().max(400).optional(),
  timeSignature: z.string().max(20).optional(),
  genre: z.string().max(100).optional(),
  notes: z.string().max(10000).optional(),
});
export type CreateSongInput = z.infer<typeof createSongSchema>;

export const updateSongSchema = createSongSchema.partial().extend({
  isFavorite: z.boolean().optional(),
  coverMediaId: z.string().nullable().optional(),
});
export type UpdateSongInput = z.infer<typeof updateSongSchema>;

/** Filters + sort for the song list / search (RF-31, RF-32). */
export const songQuerySchema = z.object({
  q: z.string().optional(),
  status: statusEnum.optional(),
  collectionId: z.string().optional(),
  tagId: z.string().optional(),
  favorite: z.coerce.boolean().optional(),
  trashed: z.coerce.boolean().optional(),
  sort: z.enum(['updatedAt', 'createdAt', 'title']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type SongQuery = z.infer<typeof songQuerySchema>;
