import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ConfirmUploadInput,
  MediaAsset as MediaAssetResponse,
  MediaUrlResult,
  PresignUploadInput,
  PresignUploadResult,
} from '@monorepo/core';
import type { MediaAsset } from '@prisma/client';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

function toResponse(m: MediaAsset): MediaAssetResponse {
  return {
    id: m.id,
    songId: m.songId,
    collectionId: m.collectionId,
    type: m.type,
    label: m.label,
    mime: m.mime,
    sizeBytes: m.sizeBytes,
    durationSec: m.durationSec,
    createdAt: m.createdAt.toISOString(),
  };
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: AppConfigService,
  ) {}

  async presign(
    userId: string,
    dto: PresignUploadInput,
  ): Promise<PresignUploadResult> {
    await this.assertOwner(userId, dto.songId, dto.collectionId);
    await this.assertWithinQuota(userId, dto.sizeBytes);
    const storageKey = this.storage.buildKey(userId, dto.type, dto.mime);
    const uploadUrl = await this.storage.getPresignedPutUrl(storageKey, dto.mime);
    return {
      uploadUrl,
      storageKey,
      expiresInSeconds: this.storage.presignExpiresSeconds,
    };
  }

  async confirm(
    userId: string,
    dto: ConfirmUploadInput,
  ): Promise<MediaAssetResponse> {
    await this.assertOwner(userId, dto.songId, dto.collectionId);
    const created = await this.prisma.mediaAsset.create({
      data: {
        songId: dto.songId ?? null,
        collectionId: dto.collectionId ?? null,
        type: dto.type,
        label: dto.label,
        storageKey: dto.storageKey,
        mime: dto.mime,
        sizeBytes: dto.sizeBytes,
        durationSec: dto.durationSec ?? null,
      },
    });
    return toResponse(created);
  }

  async getUrl(userId: string, id: string): Promise<MediaUrlResult> {
    const media = await this.requireOwned(userId, id);
    const url = await this.storage.getPresignedGetUrl(media.storageKey);
    return { url, expiresInSeconds: this.storage.presignExpiresSeconds };
  }

  async remove(userId: string, id: string): Promise<void> {
    const media = await this.requireOwned(userId, id);
    // coverMediaId FKs are ON DELETE SET NULL, so covers clear automatically.
    await this.prisma.mediaAsset.delete({ where: { id } });
    void this.storage.deleteObject(media.storageKey).catch(() => undefined);
  }

  async listForSong(
    userId: string,
    songId: string,
  ): Promise<MediaAssetResponse[]> {
    await this.assertOwner(userId, songId, undefined);
    const rows = await this.prisma.mediaAsset.findMany({
      where: { songId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toResponse);
  }

  async listForCollection(
    userId: string,
    collectionId: string,
  ): Promise<MediaAssetResponse[]> {
    await this.assertOwner(userId, undefined, collectionId);
    const rows = await this.prisma.mediaAsset.findMany({
      where: { collectionId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toResponse);
  }

  /** Verify the target Song/Collection exists and belongs to the user. */
  private async assertOwner(
    userId: string,
    songId: string | undefined,
    collectionId: string | undefined,
  ): Promise<void> {
    if (Boolean(songId) === Boolean(collectionId)) {
      throw new BadRequestException(
        'Provide exactly one of songId or collectionId',
      );
    }
    if (songId) {
      const song = await this.prisma.song.findFirst({
        where: { id: songId, userId },
        select: { id: true },
      });
      if (!song) throw new NotFoundException('Song not found');
    } else {
      const collection = await this.prisma.collection.findFirst({
        where: { id: collectionId, userId },
        select: { id: true },
      });
      if (!collection) throw new NotFoundException('Collection not found');
    }
  }

  private async requireOwned(
    userId: string,
    id: string,
  ): Promise<MediaAsset> {
    const media = await this.prisma.mediaAsset.findFirst({
      where: { id, OR: [{ song: { userId } }, { collection: { userId } }] },
    });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  /** Enforce the per-user total storage budget (RNF-20). */
  private async assertWithinQuota(
    userId: string,
    additionalBytes: number,
  ): Promise<void> {
    const limit = this.config.get('MEDIA_MAX_BYTES_PER_USER');
    const agg = await this.prisma.mediaAsset.aggregate({
      _sum: { sizeBytes: true },
      where: { OR: [{ song: { userId } }, { collection: { userId } }] },
    });
    const used = agg._sum.sizeBytes ?? 0;
    if (used + additionalBytes > limit) {
      throw new ForbiddenException('Storage quota exceeded');
    }
  }
}
