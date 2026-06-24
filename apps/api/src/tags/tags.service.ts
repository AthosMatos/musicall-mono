import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Tag as TagResponse } from '@monorepo/core';
import { Prisma, type Tag } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function toResponse(t: Tag): TagResponse {
  return { id: t.id, name: t.name };
}

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<TagResponse[]> {
    const rows = await this.prisma.tag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    return rows.map(toResponse);
  }

  async create(userId: string, name: string): Promise<TagResponse> {
    try {
      const tag = await this.prisma.tag.create({ data: { userId, name } });
      return toResponse(tag);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Tag already exists');
      }
      throw e;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.tag.deleteMany({
      where: { id, userId },
    });
    if (count === 0) throw new NotFoundException('Tag not found');
  }

  async applyToSong(
    userId: string,
    songId: string,
    tagId: string,
  ): Promise<void> {
    await this.assertSongOwned(userId, songId);
    await this.assertTagOwned(userId, tagId);
    try {
      await this.prisma.songTag.create({ data: { songId, tagId } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return; // already applied — idempotent
      }
      throw e;
    }
  }

  async removeFromSong(
    userId: string,
    songId: string,
    tagId: string,
  ): Promise<void> {
    await this.assertSongOwned(userId, songId);
    await this.prisma.songTag.deleteMany({ where: { songId, tagId } });
  }

  private async assertSongOwned(
    userId: string,
    songId: string,
  ): Promise<void> {
    const song = await this.prisma.song.findFirst({
      where: { id: songId, userId },
      select: { id: true },
    });
    if (!song) throw new NotFoundException('Song not found');
  }

  private async assertTagOwned(userId: string, tagId: string): Promise<void> {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, userId },
      select: { id: true },
    });
    if (!tag) throw new NotFoundException('Tag not found');
  }
}
