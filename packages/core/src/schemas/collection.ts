import { z } from 'zod';
import {
  collectionStatusValues,
  collectionTypeValues,
  type CollectionStatus,
  type CollectionType,
} from '../domain/status.js';

const statusEnum = z.enum(
  collectionStatusValues as [CollectionStatus, ...CollectionStatus[]],
);
const typeEnum = z.enum(
  collectionTypeValues as [CollectionType, ...CollectionType[]],
);

export const collectionSchema = z.object({
  id: z.string(),
  type: typeEnum,
  title: z.string(),
  description: z.string().nullable(),
  status: statusEnum,
  coverMediaId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});
export type Collection = z.infer<typeof collectionSchema>;

export const createCollectionSchema = z.object({
  type: typeEnum,
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: statusEnum.default('draft'),
});
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

export const updateCollectionSchema = createCollectionSchema.partial().extend({
  coverMediaId: z.string().nullable().optional(),
});
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

/** Add a song to a collection / reorder tracks (RF-28). */
export const reorderSongsSchema = z.object({
  // Ordered list of songIds defining the new track order.
  songIds: z.array(z.string()).min(1),
});
export type ReorderSongsInput = z.infer<typeof reorderSongsSchema>;

export const addSongToCollectionSchema = z.object({
  songId: z.string(),
});
export type AddSongToCollectionInput = z.infer<
  typeof addSongToCollectionSchema
>;

/** Filters + sort for the collection list. */
export const collectionQuerySchema = z.object({
  type: typeEnum.optional(),
  status: statusEnum.optional(),
  trashed: z.coerce.boolean().optional(),
  sort: z.enum(['updatedAt', 'createdAt', 'title']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type CollectionQuery = z.infer<typeof collectionQuerySchema>;
