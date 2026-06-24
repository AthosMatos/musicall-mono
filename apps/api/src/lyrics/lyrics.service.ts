import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateLyricVersionInput,
  LyricVersion as LyricVersionResponse,
  UpdateLyricVersionInput,
} from '@monorepo/core';
import type { LyricVersion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SongsService } from '../songs/songs.service';

function toResponse(v: LyricVersion): LyricVersionResponse {
  return {
    id: v.id,
    songId: v.songId,
    label: v.label,
    content: v.content,
    isPrimary: v.isPrimary,
    createdAt: v.createdAt.toISOString(),
  };
}

@Injectable()
export class LyricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly songs: SongsService,
  ) {}

  async list(
    userId: string,
    songId: string,
  ): Promise<LyricVersionResponse[]> {
    await this.songs.requireOwned(userId, songId);
    const rows = await this.prisma.lyricVersion.findMany({
      where: { songId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toResponse);
  }

  async create(
    userId: string,
    songId: string,
    dto: CreateLyricVersionInput,
  ): Promise<LyricVersionResponse> {
    await this.songs.requireOwned(userId, songId);
    const existingCount = await this.prisma.lyricVersion.count({
      where: { songId },
    });
    // First version is primary by default; otherwise honour the flag.
    const isPrimary = dto.isPrimary ?? existingCount === 0;

    const created = await this.prisma.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.lyricVersion.updateMany({
          where: { songId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.lyricVersion.create({
        data: {
          songId,
          label: dto.label,
          content: dto.content,
          isPrimary,
        },
      });
    });
    return toResponse(created);
  }

  async update(
    userId: string,
    songId: string,
    id: string,
    dto: UpdateLyricVersionInput,
  ): Promise<LyricVersionResponse> {
    await this.requireOwned(userId, songId, id);
    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary === true) {
        await tx.lyricVersion.updateMany({
          where: { songId, isPrimary: true, id: { not: id } },
          data: { isPrimary: false },
        });
      }
      return tx.lyricVersion.update({
        where: { id },
        data: {
          label: dto.label,
          content: dto.content,
          isPrimary: dto.isPrimary,
        },
      });
    });
    return toResponse(updated);
  }

  async setPrimary(
    userId: string,
    songId: string,
    id: string,
  ): Promise<LyricVersionResponse> {
    await this.requireOwned(userId, songId, id);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.lyricVersion.updateMany({
        where: { songId, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
      return tx.lyricVersion.update({
        where: { id },
        data: { isPrimary: true },
      });
    });
    return toResponse(updated);
  }

  async remove(userId: string, songId: string, id: string): Promise<void> {
    await this.requireOwned(userId, songId, id);
    await this.prisma.lyricVersion.delete({ where: { id } });
  }

  private async requireOwned(
    userId: string,
    songId: string,
    id: string,
  ): Promise<void> {
    await this.songs.requireOwned(userId, songId);
    const version = await this.prisma.lyricVersion.findFirst({
      where: { id, songId },
      select: { id: true },
    });
    if (!version) throw new NotFoundException('Lyric version not found');
  }
}
