import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateSongInput,
  PaginatedResult,
  Song as SongResponse,
  SongQuery,
  UpdateSongInput,
} from '@monorepo/core';
import { Prisma, type Song } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

export function toSongResponse(song: Song): SongResponse {
  return {
    id: song.id,
    title: song.title,
    status: song.status,
    key: song.key,
    bpm: song.bpm,
    timeSignature: song.timeSignature,
    genre: song.genre,
    notes: song.notes,
    isFavorite: song.isFavorite,
    coverMediaId: song.coverMediaId,
    createdAt: song.createdAt.toISOString(),
    updatedAt: song.updatedAt.toISOString(),
    deletedAt: song.deletedAt ? song.deletedAt.toISOString() : null,
  };
}

@Injectable()
export class SongsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(
    userId: string,
    query: SongQuery,
  ): Promise<PaginatedResult<SongResponse>> {
    const skip = (query.page - 1) * query.pageSize;
    const take = query.pageSize;

    if (query.q) {
      return this.searchByText(userId, query, skip, take);
    }

    const where = this.buildWhere(userId, query);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.song.findMany({
        where,
        orderBy: { [query.sort]: query.order },
        skip,
        take,
      }),
      this.prisma.song.count({ where }),
    ]);
    return {
      items: rows.map(toSongResponse),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async get(userId: string, id: string): Promise<SongResponse> {
    const song = await this.requireOwned(userId, id);
    return toSongResponse(song);
  }

  async create(userId: string, dto: CreateSongInput): Promise<SongResponse> {
    const song = await this.prisma.song.create({
      data: { ...dto, userId },
    });
    return toSongResponse(song);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateSongInput,
  ): Promise<SongResponse> {
    await this.requireOwned(userId, id);
    const song = await this.prisma.song.update({ where: { id }, data: dto });
    return toSongResponse(song);
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.song.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (count === 0) throw new NotFoundException('Song not found');
  }

  async restore(userId: string, id: string): Promise<SongResponse> {
    const { count } = await this.prisma.song.updateMany({
      where: { id, userId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    if (count === 0) throw new NotFoundException('Song not in trash');
    const song = await this.prisma.song.findUniqueOrThrow({ where: { id } });
    return toSongResponse(song);
  }

  /** Permanent delete: cascade DB rows, then async-purge storage objects. */
  async purge(userId: string, id: string): Promise<void> {
    const song = await this.prisma.song.findFirst({
      where: { id, userId },
      include: { media: { select: { storageKey: true } } },
    });
    if (!song) throw new NotFoundException('Song not found');
    await this.prisma.song.delete({ where: { id } });
    void this.storage
      .deleteObjects(song.media.map((m) => m.storageKey))
      .catch(() => undefined);
  }

  /** Decision 11: deep-copy text + tags; server-side copy of media objects. */
  async duplicate(userId: string, id: string): Promise<SongResponse> {
    const src = await this.prisma.song.findFirst({
      where: { id, userId },
      include: {
        lyricVersions: true,
        chordCharts: true,
        tablatures: true,
        media: true,
        tags: true,
      },
    });
    if (!src) throw new NotFoundException('Song not found');

    const copy = await this.prisma.song.create({
      data: {
        userId,
        title: `${src.title} (copy)`,
        status: 'draft',
        key: src.key,
        bpm: src.bpm,
        timeSignature: src.timeSignature,
        genre: src.genre,
        notes: src.notes,
        isFavorite: false,
        lyricVersions: {
          create: src.lyricVersions.map((v) => ({
            label: v.label,
            content: v.content,
            isPrimary: v.isPrimary,
          })),
        },
        chordCharts: {
          create: src.chordCharts.map((c) => ({
            label: c.label,
            content: c.content,
          })),
        },
        tablatures: {
          create: src.tablatures.map((t) => ({
            label: t.label,
            content: t.content,
            instrument: t.instrument,
          })),
        },
        tags: { create: src.tags.map((t) => ({ tagId: t.tagId })) },
      },
    });

    // Independent storage objects per decision 11 (S3 CopyObject; no egress).
    for (const m of src.media) {
      const destKey = this.storage.buildKey(userId, m.type, m.mime);
      await this.storage.copyObject(m.storageKey, destKey);
      await this.prisma.mediaAsset.create({
        data: {
          songId: copy.id,
          type: m.type,
          label: m.label,
          storageKey: destKey,
          mime: m.mime,
          sizeBytes: m.sizeBytes,
          durationSec: m.durationSec,
        },
      });
    }

    return toSongResponse(copy);
  }

  /** Ensures the song exists and belongs to the user. */
  async requireOwned(userId: string, id: string): Promise<Song> {
    const song = await this.prisma.song.findFirst({ where: { id, userId } });
    if (!song) throw new NotFoundException('Song not found');
    return song;
  }

  private buildWhere(userId: string, query: SongQuery): Prisma.SongWhereInput {
    return {
      userId,
      deletedAt: query.trashed ? { not: null } : null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.favorite ? { isFavorite: true } : {}),
      ...(query.collectionId
        ? { collections: { some: { collectionId: query.collectionId } } }
        : {}),
      ...(query.tagId ? { tags: { some: { tagId: query.tagId } } } : {}),
    };
  }

  /** Postgres full-text search (decision 13): rank by ts_rank, then hydrate. */
  private async searchByText(
    userId: string,
    query: SongQuery,
    skip: number,
    take: number,
  ): Promise<PaginatedResult<SongResponse>> {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`s."userId" = ${userId}`,
      query.trashed
        ? Prisma.sql`s."deletedAt" IS NOT NULL`
        : Prisma.sql`s."deletedAt" IS NULL`,
      Prisma.sql`s."searchVector" @@ websearch_to_tsquery('portuguese', ${query.q})`,
    ];
    if (query.status) {
      conditions.push(Prisma.sql`s."status" = ${query.status}::"SongStatus"`);
    }
    if (query.favorite) conditions.push(Prisma.sql`s."isFavorite" = true`);
    if (query.collectionId) {
      conditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM "CollectionSong" cs WHERE cs."songId" = s.id AND cs."collectionId" = ${query.collectionId})`,
      );
    }
    if (query.tagId) {
      conditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM "SongTag" st WHERE st."songId" = s.id AND st."tagId" = ${query.tagId})`,
      );
    }
    const whereSql = Prisma.join(conditions, ' AND ');
    const rankSql = Prisma.sql`ts_rank(s."searchVector", websearch_to_tsquery('portuguese', ${query.q}))`;

    const [idRows, countRows] = await Promise.all([
      this.prisma.$queryRaw<{ id: string }[]>(
        Prisma.sql`SELECT s.id FROM "Song" s WHERE ${whereSql} ORDER BY ${rankSql} DESC OFFSET ${skip} LIMIT ${take}`,
      ),
      this.prisma.$queryRaw<{ count: bigint }[]>(
        Prisma.sql`SELECT COUNT(*)::bigint AS count FROM "Song" s WHERE ${whereSql}`,
      ),
    ]);

    const ids = idRows.map((r) => r.id);
    const songs = await this.prisma.song.findMany({ where: { id: { in: ids } } });
    const byId = new Map(songs.map((s) => [s.id, s]));
    const items = ids
      .map((id) => byId.get(id))
      .filter((s): s is Song => Boolean(s))
      .map(toSongResponse);

    return {
      items,
      total: Number(countRows[0]?.count ?? 0),
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}
