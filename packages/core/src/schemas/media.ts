import { z } from 'zod';
import { mediaTypeValues, type MediaType } from '../domain/status.js';

const mediaTypeEnum = z.enum(
  mediaTypeValues as [MediaType, ...MediaType[]],
);

export const mediaAssetSchema = z.object({
  id: z.string(),
  songId: z.string().nullable(),
  collectionId: z.string().nullable(),
  type: mediaTypeEnum,
  label: z.string(),
  mime: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  durationSec: z.number().int().nonnegative().nullable(),
  createdAt: z.string().datetime(),
});
export type MediaAsset = z.infer<typeof mediaAssetSchema>;

/** Step 1: ask the API for a presigned PUT URL (ADR-0002). */
export const presignUploadSchema = z
  .object({
    type: mediaTypeEnum,
    mime: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    songId: z.string().optional(),
    collectionId: z.string().optional(),
  })
  .refine(
    (v) => Boolean(v.songId) !== Boolean(v.collectionId),
    'Provide exactly one of songId or collectionId',
  );
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;

export const presignUploadResultSchema = z.object({
  uploadUrl: z.string().url(),
  storageKey: z.string(),
  expiresInSeconds: z.number().int().positive(),
});
export type PresignUploadResult = z.infer<typeof presignUploadResultSchema>;

/** Step 3: after the direct PUT succeeds, persist the metadata. */
export const confirmUploadSchema = z
  .object({
    storageKey: z.string().min(1),
    type: mediaTypeEnum,
    label: z.string().min(1).max(200),
    mime: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    durationSec: z.number().int().nonnegative().optional(),
    songId: z.string().optional(),
    collectionId: z.string().optional(),
  })
  .refine(
    (v) => Boolean(v.songId) !== Boolean(v.collectionId),
    'Provide exactly one of songId or collectionId',
  );
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;

/** Playback / download: a short-lived signed GET URL. */
export const mediaUrlResultSchema = z.object({
  url: z.string().url(),
  expiresInSeconds: z.number().int().positive(),
});
export type MediaUrlResult = z.infer<typeof mediaUrlResultSchema>;
