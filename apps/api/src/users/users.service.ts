import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  PresignUploadResult,
  UpdateProfileInput,
  User as UserResponse,
} from '@monorepo/core';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getMe(userId: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.toResponse(user);
  }

  async updateMe(
    userId: string,
    dto: UpdateProfileInput,
  ): Promise<UserResponse> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name, email: dto.email },
    });
    return this.toResponse(user);
  }

  async presignAvatar(
    userId: string,
    mime: string,
  ): Promise<PresignUploadResult> {
    const storageKey = this.storage.buildKey(userId, 'avatar', mime);
    const uploadUrl = await this.storage.getPresignedPutUrl(storageKey, mime);
    return {
      uploadUrl,
      storageKey,
      expiresInSeconds: this.storage.presignExpiresSeconds,
    };
  }

  async setAvatar(userId: string, avatarKey: string): Promise<UserResponse> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarKey },
    });
    return this.toResponse(user);
  }

  /** LGPD: hard-delete the user (cascades all data) then purge storage objects. */
  async deleteMe(userId: string): Promise<void> {
    const keys = await this.collectStorageKeys(userId);
    await this.prisma.user.delete({ where: { id: userId } });
    // Best-effort async cleanup; DB is already consistent.
    void this.storage.deleteObjects(keys).catch(() => undefined);
  }

  /** LGPD: full export of the user's personal data as JSON. */
  async exportData(userId: string): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        songs: {
          include: {
            lyricVersions: true,
            chordCharts: true,
            tablatures: true,
            media: true,
            tags: { include: { tag: true } },
          },
        },
        collections: { include: { media: true, songs: true } },
        tags: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async collectStorageKeys(userId: string): Promise<string[]> {
    const [assets, user] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where: {
          OR: [{ song: { userId } }, { collection: { userId } }],
        },
        select: { storageKey: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { avatarKey: true },
      }),
    ]);
    const keys = assets.map((a) => a.storageKey);
    if (user?.avatarKey) keys.push(user.avatarKey);
    return keys;
  }

  private async toResponse(user: User): Promise<UserResponse> {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarKey
        ? await this.storage.getPresignedGetUrl(user.avatarKey)
        : null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
