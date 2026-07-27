/**
 * Realm object schemas — the app's only source of truth. Everything lives on
 * the device; there is no server and no sync (see `src/db/realm.ts`).
 *
 * The property names mirror the domain glossary in the repo's CONTEXT.md so
 * screens keep reading `song.title`, `song.status`, `collection.type`, … just
 * as they did when the data came from the API.
 *
 * Primary keys are called `id` (not the Realm-idiomatic `_id`) and hold plain
 * hex UUID strings, because they double as expo-router path params.
 */
import type { CollectionStatus, CollectionType, MediaType, SongStatus } from "@monorepo/core";
import { Realm } from "realm";

/** Fresh primary key for any of the objects below. */
export function newId(): string {
  return new Realm.BSON.UUID().toHexString();
}

/** The one and only profile row's primary key — the app is single-user. */
export const PROFILE_ID = "me";

export class UserProfile extends Realm.Object<UserProfile> {
  id!: string;
  name!: string;
  /** Local file URI of the avatar picked during onboarding. */
  avatarUri!: string | null;
  /** BCP-47 base tag chosen on the first screen: "pt" or "en". */
  language!: string;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: "UserProfile",
    primaryKey: "id",
    properties: {
      id: "string",
      name: "string",
      avatarUri: "string?",
      language: { type: "string", default: "pt" },
      createdAt: "date",
    },
  };
}

export class Song extends Realm.Object<Song> {
  id!: string;
  title!: string;
  status!: SongStatus;
  key!: string | null;
  bpm!: number | null;
  timeSignature!: string | null;
  genre!: string | null;
  notes!: string | null;
  isFavorite!: boolean;
  coverMediaId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  /** Soft delete — the trash. Non-null rows are hidden from every list. */
  deletedAt!: Date | null;

  static schema: Realm.ObjectSchema = {
    name: "Song",
    primaryKey: "id",
    properties: {
      id: "string",
      title: "string",
      status: { type: "string", default: "draft" },
      key: "string?",
      bpm: "int?",
      timeSignature: "string?",
      genre: "string?",
      notes: "string?",
      isFavorite: { type: "bool", default: false },
      coverMediaId: "string?",
      createdAt: "date",
      updatedAt: "date",
      deletedAt: "date?",
    },
  };
}

export class LyricVersion extends Realm.Object<LyricVersion> {
  id!: string;
  songId!: string;
  label!: string;
  content!: string;
  isPrimary!: boolean;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: "LyricVersion",
    primaryKey: "id",
    properties: {
      id: "string",
      songId: { type: "string", indexed: true },
      label: "string",
      content: "string",
      isPrimary: { type: "bool", default: false },
      createdAt: "date",
    },
  };
}

export class ChordChart extends Realm.Object<ChordChart> {
  id!: string;
  songId!: string;
  label!: string;
  content!: string;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: "ChordChart",
    primaryKey: "id",
    properties: {
      id: "string",
      songId: { type: "string", indexed: true },
      label: "string",
      content: "string",
      createdAt: "date",
    },
  };
}

export class Tablature extends Realm.Object<Tablature> {
  id!: string;
  songId!: string;
  label!: string;
  content!: string;
  instrument!: string | null;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: "Tablature",
    primaryKey: "id",
    properties: {
      id: "string",
      songId: { type: "string", indexed: true },
      label: "string",
      content: "string",
      instrument: "string?",
      createdAt: "date",
    },
  };
}

export class MediaAsset extends Realm.Object<MediaAsset> {
  id!: string;
  songId!: string | null;
  collectionId!: string | null;
  type!: MediaType;
  label!: string;
  mime!: string;
  sizeBytes!: number;
  durationSec!: number | null;
  /**
   * `file://` URI inside the app's document directory. Bytes are copied there
   * on import so the asset survives the OS clearing the cache directory.
   */
  uri!: string;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: "MediaAsset",
    primaryKey: "id",
    properties: {
      id: "string",
      songId: { type: "string", optional: true, indexed: true },
      collectionId: { type: "string", optional: true, indexed: true },
      type: "string",
      label: "string",
      mime: "string",
      sizeBytes: { type: "int", default: 0 },
      durationSec: "double?",
      uri: "string",
      createdAt: "date",
    },
  };
}

export class Collection extends Realm.Object<Collection> {
  id!: string;
  type!: CollectionType;
  title!: string;
  description!: string | null;
  status!: CollectionStatus;
  coverMediaId!: string | null;
  /** Track order — the list position *is* the track number. */
  songIds!: Realm.List<string>;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;

  static schema: Realm.ObjectSchema = {
    name: "Collection",
    primaryKey: "id",
    properties: {
      id: "string",
      type: { type: "string", default: "album" },
      title: "string",
      description: "string?",
      status: { type: "string", default: "draft" },
      coverMediaId: "string?",
      songIds: "string[]",
      createdAt: "date",
      updatedAt: "date",
      deletedAt: "date?",
    },
  };
}

export const schemas = [
  UserProfile,
  Song,
  LyricVersion,
  ChordChart,
  Tablature,
  MediaAsset,
  Collection,
];
