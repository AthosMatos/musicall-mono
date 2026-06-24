import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Collection as CollectionResponse,
  CollectionQuery,
  CreateCollectionInput,
  PaginatedResult,
  UpdateCollectionInput,
} from '@monorepo/core';
import { Prisma, type Collection } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

function toResponse(c: Collection): CollectionResponse {
  return {
    id: c.id,
    type: c.type,
    title: c.title,
    description: c.description,
    status: c.status,
    coverMediaId: c.coverMediaId,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
  };
}

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(
    userId: string,
    query: CollectionQuery,
  ): Promise<PaginatedResult<CollectionResponse>> {
    const where: Prisma.CollectionWhereInput = {
      userId,
      deletedAt: query.trashed ? { not: null } : null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.collection.findMany({
        where,
        orderBy: { [query.sort]: query.order },
        skip,
        take: query.pageSize,
      }),
      this.prisma.collection.count({ where }),
    ]);
    return {
      items: rows.map(toResponse),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async get(userId: string, id: string): Promise<CollectionResponse> {
    return toResponse(await this.requireOwned(userId, id));
  }

  async create(
    userId: string,
    dto: CreateCollectionInput,
  ): Promise<CollectionResponse> {
    const collection = await this.prisma.collection.create({
      data: { ...dto, userId },
    });
    return toResponse(collection);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCollectionInput,
  ): Promise<CollectionResponse> {
    await this.requireOwned(userId, id);
    const collection = await this.prisma.collection.update({
      where: { id },
      data: dto,
    });
    return toResponse(collection);
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.collection.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (count === 0) throw new NotFoundException('Collection not found');
  }

  async restore(userId: string, id: string): Promise<CollectionResponse> {
    const { count } = await this.prisma.collection.updateMany({
      where: { id, userId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    if (count === 0) throw new NotFoundException('Collection not in trash');
    return toResponse(
      await this.prisma.collection.findUniqueOrThrow({ where: { id } }),
    );
  }

  async purge(userId: string, id: string): Promise<void> {
    const collection = await this.prisma.collection.findFirst({
      where: { id, userId },
      include: { media: { select: { storageKey: true } } },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    await this.prisma.collection.delete({ where: { id } });
    void this.storage
      .deleteObjects(collection.media.map((m) => m.storageKey))
      .catch(() => undefined);
  }

  async addSong(
    userId: string,
    collectionId: string,
    songId: string,
  ): Promise<void> {
    await this.requireOwned(userId, collectionId);
    await this.requireOwnedSong(userId, songId);
    const last = await this.prisma.collectionSong.findFirst({
      where: { collectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    try {
      await this.prisma.collectionSong.create({
        data: { collectionId, songId, order: (last?.order ?? -1) + 1 },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Song already in collection');
      }
      throw e;
    }
  }

  async removeSong(
    userId: string,
    collectionId: string,
    songId: string,
  ): Promise<void> {
    await this.requireOwned(userId, collectionId);
    const { count } = await this.prisma.collectionSong.deleteMany({
      where: { collectionId, songId },
    });
    if (count === 0) throw new NotFoundException('Song not in collection');
  }

  /** Reorder tracks (RF-28); songIds must be exactly the current members. */
  async reorder(
    userId: string,
    collectionId: string,
    songIds: string[],
  ): Promise<void> {
    await this.requireOwned(userId, collectionId);
    const members = await this.prisma.collectionSong.findMany({
      where: { collectionId },
      select: { songId: true },
    });
    const memberIds = new Set(members.map((m) => m.songId));
    if (
      songIds.length !== memberIds.size ||
      !songIds.every((id) => memberIds.has(id))
    ) {
      throw new ConflictException(
        'songIds must match the collection members exactly',
      );
    }
    await this.prisma.$transaction(
      songIds.map((songId, index) =>
        this.prisma.collectionSong.update({
          where: { collectionId_songId: { collectionId, songId } },
          data: { order: index },
        }),
      ),
    );
  }

  private async requireOwned(
    userId: string,
    id: string,
  ): Promise<Collection> {
    const collection = await this.prisma.collection.findFirst({
      where: { id, userId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  private async requireOwnedSong(
    userId: string,
    songId: string,
  ): Promise<void> {
    const song = await this.prisma.song.findFirst({
      where: { id: songId, userId },
      select: { id: true },
    });
    if (!song) throw new NotFoundException('Song not found');
  }
}
