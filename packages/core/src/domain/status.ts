/** Canonical domain enums, mirrored from the Prisma schema (see CONTEXT.md). */

export const songStatus = {
  draft: 'draft',
  inProgress: 'in_progress',
  finished: 'finished',
} as const;
export type SongStatus = (typeof songStatus)[keyof typeof songStatus];

export const collectionStatus = {
  draft: 'draft',
  inProgress: 'in_progress',
  released: 'released',
} as const;
export type CollectionStatus =
  (typeof collectionStatus)[keyof typeof collectionStatus];

export const collectionType = {
  album: 'album',
  single: 'single',
} as const;
export type CollectionType = (typeof collectionType)[keyof typeof collectionType];

export const mediaType = {
  audio: 'audio',
  image: 'image',
} as const;
export type MediaType = (typeof mediaType)[keyof typeof mediaType];

export const songStatusValues = Object.values(songStatus);
export const collectionStatusValues = Object.values(collectionStatus);
export const collectionTypeValues = Object.values(collectionType);
export const mediaTypeValues = Object.values(mediaType);
