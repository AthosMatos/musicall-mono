import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateTablatureInput,
  Tablature as TablatureResponse,
  UpdateTablatureInput,
} from '@monorepo/core';
import type { Tablature } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SongsService } from '../songs/songs.service';

function toResponse(t: Tablature): TablatureResponse {
  return {
    id: t.id,
    songId: t.songId,
    label: t.label,
    content: t.content,
    instrument: t.instrument,
    createdAt: t.createdAt.toISOString(),
  };
}

@Injectable()
export class TabsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly songs: SongsService,
  ) {}

  async list(userId: string, songId: string): Promise<TablatureResponse[]> {
    await this.songs.requireOwned(userId, songId);
    const rows = await this.prisma.tablature.findMany({
      where: { songId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toResponse);
  }

  async create(
    userId: string,
    songId: string,
    dto: CreateTablatureInput,
  ): Promise<TablatureResponse> {
    await this.songs.requireOwned(userId, songId);
    const created = await this.prisma.tablature.create({
      data: {
        songId,
        label: dto.label,
        content: dto.content,
        instrument: dto.instrument,
      },
    });
    return toResponse(created);
  }

  async update(
    userId: string,
    songId: string,
    id: string,
    dto: UpdateTablatureInput,
  ): Promise<TablatureResponse> {
    await this.requireOwned(userId, songId, id);
    const updated = await this.prisma.tablature.update({
      where: { id },
      data: {
        label: dto.label,
        content: dto.content,
        instrument: dto.instrument,
      },
    });
    return toResponse(updated);
  }

  async remove(userId: string, songId: string, id: string): Promise<void> {
    await this.requireOwned(userId, songId, id);
    await this.prisma.tablature.delete({ where: { id } });
  }

  private async requireOwned(
    userId: string,
    songId: string,
    id: string,
  ): Promise<void> {
    await this.songs.requireOwned(userId, songId);
    const row = await this.prisma.tablature.findFirst({
      where: { id, songId },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Tablature not found');
  }
}
