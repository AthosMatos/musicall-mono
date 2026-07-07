/**
 * Hand-written companions to the generated hooks (./hooks) for endpoints whose
 * query parameters the OpenAPI codegen does not emit. Same conventions:
 * `xxx()` fetches, `xxxKey()` is the cache key, `xxxOptions()` plugs into
 * TanStack Query.
 */

import { apiRequest } from './client.js';
import type {
  CollectionListDto,
  SongListDto,
  SongResponseDto,
} from './generated/index.js';

/** Filters for `GET /api/songs` (mirrors songQuerySchema). */
export interface SongsSearchQuery {
  q?: string;
  status?: 'draft' | 'in_progress' | 'finished';
  collectionId?: string;
  tagId?: string;
  favorite?: boolean;
  sort?: 'updatedAt' | 'createdAt' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export async function songsSearch(query: SongsSearchQuery = {}): Promise<SongListDto> {
  return apiRequest<SongListDto>({
    method: 'GET',
    path: '/api/songs',
    query: { ...query },
  });
}

export function songsSearchKey(query: SongsSearchQuery = {}) {
  return ['songs-list', query] as const;
}

export function songsSearchOptions(query: SongsSearchQuery = {}) {
  return {
    queryKey: songsSearchKey(query),
    queryFn: () => songsSearch(query),
  };
}

/** Filters for `GET /api/collections` (mirrors collectionQuerySchema). */
export interface CollectionsSearchQuery {
  type?: 'album' | 'single';
  status?: 'draft' | 'in_progress' | 'released';
  sort?: 'updatedAt' | 'createdAt' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export async function collectionsSearch(
  query: CollectionsSearchQuery = {},
): Promise<CollectionListDto> {
  return apiRequest<CollectionListDto>({
    method: 'GET',
    path: '/api/collections',
    query: { ...query },
  });
}

export function collectionsSearchKey(query: CollectionsSearchQuery = {}) {
  return ['collections-list', query] as const;
}

export function collectionsSearchOptions(query: CollectionsSearchQuery = {}) {
  return {
    queryKey: collectionsSearchKey(query),
    queryFn: () => collectionsSearch(query),
  };
}

/**
 * The collection's tracks in playlist order.
 * `GET /api/collections/{id}/songs`
 */
export async function collectionsListSongs(id: string): Promise<SongResponseDto[]> {
  return apiRequest<SongResponseDto[]>({
    method: 'GET',
    path: `/api/collections/${id}/songs`,
  });
}

export function collectionsListSongsKey(id: string) {
  return ['collections-songs', id] as const;
}

export function collectionsListSongsOptions(id: string) {
  return {
    queryKey: collectionsListSongsKey(id),
    queryFn: () => collectionsListSongs(id),
  };
}
