/**
 * Every write the app performs, in one place. Each function takes the open
 * `Realm` (from `useRealm()`) and wraps its mutations in a single transaction.
 *
 * Reads stay in the screens through `useQuery`/`useObject` so results are live;
 * the query *predicates* shared by more than one screen live at the bottom of
 * this file.
 */
import type { CollectionStatus, CollectionType, MediaType, SongStatus } from "@monorepo/core";
import type Realm from "realm";
import {
  ChordChart,
  Collection,
  LyricVersion,
  MediaAsset,
  newId,
  PROFILE_ID,
  Song,
  Tablature,
  UserProfile,
} from "./schemas";

/* -------------------------------------------------------------------------- */
/* profile                                                                     */
/* -------------------------------------------------------------------------- */

export function getProfile(realm: Realm): UserProfile | null {
  return realm.objectForPrimaryKey(UserProfile, PROFILE_ID);
}

/** Creates the profile on first run, or patches the existing one. */
export function saveProfile(
  realm: Realm,
  patch: { name?: string; avatarUri?: string | null; language?: string }
): UserProfile {
  return realm.write(() => {
    const existing = realm.objectForPrimaryKey(UserProfile, PROFILE_ID);
    if (existing) {
      if (patch.name !== undefined) existing.name = patch.name;
      if (patch.avatarUri !== undefined) existing.avatarUri = patch.avatarUri;
      if (patch.language !== undefined) existing.language = patch.language;
      return existing;
    }
    return realm.create(UserProfile, {
      id: PROFILE_ID,
      name: patch.name ?? "",
      avatarUri: patch.avatarUri ?? null,
      language: patch.language ?? "pt",
      createdAt: new Date(),
    });
  });
}

/* -------------------------------------------------------------------------- */
/* songs                                                                       */
/* -------------------------------------------------------------------------- */

export interface SongPatch {
  title?: string;
  status?: SongStatus;
  key?: string | null;
  bpm?: number | null;
  timeSignature?: string | null;
  genre?: string | null;
  notes?: string | null;
  isFavorite?: boolean;
  coverMediaId?: string | null;
}

export function createSong(realm: Realm, patch: SongPatch & { title: string }): Song {
  const now = new Date();
  return realm.write(() =>
    realm.create(Song, {
      id: newId(),
      title: patch.title,
      status: patch.status ?? "draft",
      key: patch.key ?? null,
      bpm: patch.bpm ?? null,
      timeSignature: patch.timeSignature ?? null,
      genre: patch.genre ?? null,
      notes: patch.notes ?? null,
      isFavorite: patch.isFavorite ?? false,
      coverMediaId: patch.coverMediaId ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  );
}

export function updateSong(realm: Realm, id: string, patch: SongPatch): void {
  const song = realm.objectForPrimaryKey(Song, id);
  if (!song) return;
  realm.write(() => {
    Object.assign(song, patch);
    song.updatedAt = new Date();
  });
}

/** Soft delete — the song moves to the trash and drops out of every list. */
export function trashSong(realm: Realm, id: string): void {
  const song = realm.objectForPrimaryKey(Song, id);
  if (!song) return;
  realm.write(() => {
    song.deletedAt = new Date();
    song.updatedAt = new Date();
    // A trashed song must not keep occupying a track slot.
    for (const collection of realm.objects(Collection)) {
      const at = collection.songIds.indexOf(id);
      if (at !== -1) collection.songIds.splice(at, 1);
    }
  });
}

export function restoreSong(realm: Realm, id: string): void {
  const song = realm.objectForPrimaryKey(Song, id);
  if (!song) return;
  realm.write(() => {
    song.deletedAt = null;
    song.updatedAt = new Date();
  });
}

/**
 * Permanently deletes a song with its lyrics, chords, tabs and media rows.
 * Returns the file URIs of the deleted assets so the caller can unlink them.
 */
export function purgeSong(realm: Realm, id: string): string[] {
  const song = realm.objectForPrimaryKey(Song, id);
  if (!song) return [];
  const assets = realm.objects(MediaAsset).filtered("songId == $0", id);
  const uris = assets.map((a) => a.uri);
  realm.write(() => {
    realm.delete(realm.objects(LyricVersion).filtered("songId == $0", id));
    realm.delete(realm.objects(ChordChart).filtered("songId == $0", id));
    realm.delete(realm.objects(Tablature).filtered("songId == $0", id));
    realm.delete(assets);
    for (const collection of realm.objects(Collection)) {
      const at = collection.songIds.indexOf(id);
      if (at !== -1) collection.songIds.splice(at, 1);
    }
    realm.delete(song);
  });
  return uris;
}

/* -------------------------------------------------------------------------- */
/* lyrics                                                                      */
/* -------------------------------------------------------------------------- */

export function createLyricVersion(
  realm: Realm,
  songId: string,
  input: { label: string; content: string; isPrimary?: boolean }
): LyricVersion {
  return realm.write(() => {
    if (input.isPrimary) demotePrimaryVersions(realm, songId);
    touchSong(realm, songId);
    return realm.create(LyricVersion, {
      id: newId(),
      songId,
      label: input.label,
      content: input.content,
      isPrimary: input.isPrimary ?? false,
      createdAt: new Date(),
    });
  });
}

export function updateLyricVersion(
  realm: Realm,
  id: string,
  patch: { label?: string; content?: string; isPrimary?: boolean }
): void {
  const version = realm.objectForPrimaryKey(LyricVersion, id);
  if (!version) return;
  realm.write(() => {
    if (patch.isPrimary) demotePrimaryVersions(realm, version.songId);
    Object.assign(version, patch);
    touchSong(realm, version.songId);
  });
}

export function deleteLyricVersion(realm: Realm, id: string): void {
  const version = realm.objectForPrimaryKey(LyricVersion, id);
  if (!version) return;
  const { songId, isPrimary } = version;
  realm.write(() => {
    realm.delete(version);
    // Never leave a song with versions but no primary one.
    if (isPrimary) {
      const remaining = realm.objects(LyricVersion).filtered("songId == $0", songId);
      if (remaining.length > 0) remaining[0].isPrimary = true;
    }
    touchSong(realm, songId);
  });
}

/** Must run inside an open transaction. */
function demotePrimaryVersions(realm: Realm, songId: string): void {
  const primaries = realm
    .objects(LyricVersion)
    .filtered("songId == $0 AND isPrimary == true", songId);
  for (const version of primaries) version.isPrimary = false;
}

/* -------------------------------------------------------------------------- */
/* chords & tablatures                                                         */
/* -------------------------------------------------------------------------- */

export function saveChordChart(
  realm: Realm,
  songId: string,
  input: { id?: string; label: string; content: string }
): ChordChart {
  return realm.write(() => {
    touchSong(realm, songId);
    const existing = input.id ? realm.objectForPrimaryKey(ChordChart, input.id) : null;
    if (existing) {
      existing.label = input.label;
      existing.content = input.content;
      return existing;
    }
    return realm.create(ChordChart, {
      id: newId(),
      songId,
      label: input.label,
      content: input.content,
      createdAt: new Date(),
    });
  });
}

export function deleteChordChart(realm: Realm, id: string): void {
  const chart = realm.objectForPrimaryKey(ChordChart, id);
  if (!chart) return;
  const { songId } = chart;
  realm.write(() => {
    realm.delete(chart);
    touchSong(realm, songId);
  });
}

export function saveTablature(
  realm: Realm,
  songId: string,
  input: { id?: string; label: string; content: string; instrument?: string | null }
): Tablature {
  return realm.write(() => {
    touchSong(realm, songId);
    const existing = input.id ? realm.objectForPrimaryKey(Tablature, input.id) : null;
    if (existing) {
      existing.label = input.label;
      existing.content = input.content;
      existing.instrument = input.instrument ?? null;
      return existing;
    }
    return realm.create(Tablature, {
      id: newId(),
      songId,
      label: input.label,
      content: input.content,
      instrument: input.instrument ?? null,
      createdAt: new Date(),
    });
  });
}

export function deleteTablature(realm: Realm, id: string): void {
  const tab = realm.objectForPrimaryKey(Tablature, id);
  if (!tab) return;
  const { songId } = tab;
  realm.write(() => {
    realm.delete(tab);
    touchSong(realm, songId);
  });
}

/* -------------------------------------------------------------------------- */
/* media                                                                       */
/* -------------------------------------------------------------------------- */

export interface MediaAssetInput {
  songId?: string | null;
  collectionId?: string | null;
  type: MediaType;
  label: string;
  mime: string;
  sizeBytes: number;
  durationSec?: number | null;
  /** `file://` URI already copied into the app's document directory. */
  uri: string;
}

export function createMediaAsset(realm: Realm, input: MediaAssetInput): MediaAsset {
  return realm.write(() => {
    if (input.songId) touchSong(realm, input.songId);
    return realm.create(MediaAsset, {
      id: newId(),
      songId: input.songId ?? null,
      collectionId: input.collectionId ?? null,
      type: input.type,
      label: input.label,
      mime: input.mime,
      sizeBytes: input.sizeBytes,
      durationSec: input.durationSec ?? null,
      uri: input.uri,
      createdAt: new Date(),
    });
  });
}

/** Removes the row and returns the file URI so the caller can unlink it. */
export function deleteMediaAsset(realm: Realm, id: string): string | null {
  const asset = realm.objectForPrimaryKey(MediaAsset, id);
  if (!asset) return null;
  const { uri, songId } = asset;
  realm.write(() => {
    // Drop the cover reference so nothing points at a deleted asset.
    for (const song of realm.objects(Song).filtered("coverMediaId == $0", id)) {
      song.coverMediaId = null;
    }
    for (const collection of realm.objects(Collection).filtered("coverMediaId == $0", id)) {
      collection.coverMediaId = null;
    }
    realm.delete(asset);
    if (songId) touchSong(realm, songId);
  });
  return uri;
}

/* -------------------------------------------------------------------------- */
/* collections                                                                 */
/* -------------------------------------------------------------------------- */

export interface CollectionPatch {
  title?: string;
  description?: string | null;
  type?: CollectionType;
  status?: CollectionStatus;
  coverMediaId?: string | null;
}

export function createCollection(
  realm: Realm,
  input: CollectionPatch & { title: string; type: CollectionType }
): Collection {
  const now = new Date();
  return realm.write(() =>
    realm.create(Collection, {
      id: newId(),
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "draft",
      coverMediaId: input.coverMediaId ?? null,
      songIds: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  );
}

export function updateCollection(realm: Realm, id: string, patch: CollectionPatch): void {
  const collection = realm.objectForPrimaryKey(Collection, id);
  if (!collection) return;
  realm.write(() => {
    Object.assign(collection, patch);
    collection.updatedAt = new Date();
  });
}

/** Soft delete. The member songs are untouched. */
export function trashCollection(realm: Realm, id: string): void {
  const collection = realm.objectForPrimaryKey(Collection, id);
  if (!collection) return;
  realm.write(() => {
    collection.deletedAt = new Date();
    collection.updatedAt = new Date();
  });
}

export function restoreCollection(realm: Realm, id: string): void {
  const collection = realm.objectForPrimaryKey(Collection, id);
  if (!collection) return;
  realm.write(() => {
    collection.deletedAt = null;
    collection.updatedAt = new Date();
  });
}

/**
 * Permanently deletes a collection and its own media (cover art), but never
 * the songs it holds — those belong to the library, not the collection.
 * Returns the file URIs of the deleted assets so the caller can unlink them.
 */
export function purgeCollection(realm: Realm, id: string): string[] {
  const collection = realm.objectForPrimaryKey(Collection, id);
  if (!collection) return [];
  const assets = realm.objects(MediaAsset).filtered("collectionId == $0", id);
  const uris = assets.map((a) => a.uri);
  realm.write(() => {
    realm.delete(assets);
    realm.delete(collection);
  });
  return uris;
}

export function addSongToCollection(realm: Realm, id: string, songId: string): void {
  const collection = realm.objectForPrimaryKey(Collection, id);
  if (!collection || collection.songIds.includes(songId)) return;
  realm.write(() => {
    collection.songIds.push(songId);
    collection.updatedAt = new Date();
  });
}

export function removeSongFromCollection(realm: Realm, id: string, songId: string): void {
  const collection = realm.objectForPrimaryKey(Collection, id);
  if (!collection) return;
  const at = collection.songIds.indexOf(songId);
  if (at === -1) return;
  realm.write(() => {
    collection.songIds.splice(at, 1);
    collection.updatedAt = new Date();
  });
}

export function reorderCollectionSongs(realm: Realm, id: string, songIds: string[]): void {
  const collection = realm.objectForPrimaryKey(Collection, id);
  if (!collection) return;
  realm.write(() => {
    // Realm lists have no bulk assign — clear then refill in the new order.
    collection.songIds.splice(0, collection.songIds.length, ...songIds);
    collection.updatedAt = new Date();
  });
}

/** The collection's tracks, resolved from the ordered `songIds` list. */
export function collectionTracks(realm: Realm, collection: Collection): Song[] {
  const tracks: Song[] = [];
  for (const songId of collection.songIds) {
    const song = realm.objectForPrimaryKey(Song, songId);
    if (song && song.deletedAt == null) tracks.push(song);
  }
  return tracks;
}

/* -------------------------------------------------------------------------- */
/* shared query predicates                                                     */
/* -------------------------------------------------------------------------- */

export const NOT_TRASHED = "deletedAt == null";
export const TRASHED = "deletedAt != null SORT(deletedAt DESC)";

export function activeSongs(songs: Realm.Results<Song>): Realm.Results<Song> {
  return songs.filtered(`${NOT_TRASHED} SORT(updatedAt DESC)`);
}

export function activeCollections(
  collections: Realm.Results<Collection>
): Realm.Results<Collection> {
  return collections.filtered(`${NOT_TRASHED} SORT(updatedAt DESC)`);
}

/** Must run inside an open transaction — keeps "recently edited" honest. */
function touchSong(realm: Realm, songId: string): void {
  const song = realm.objectForPrimaryKey(Song, songId);
  if (song) song.updatedAt = new Date();
}
