import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ChordChart as ChordChartResponse,
  CreateChordChartInput,
  UpdateChordChartInput,
} from '@monorepo/core';
import type { ChordChart } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SongsService } from '../songs/songs.service';

function toResponse(c: ChordChart): ChordChartResponse {
  return {
    id: c.id,
    songId: c.songId,
    label: c.label,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
  };
}

@Injectable()
export class ChordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly songs: SongsService,
  ) {}

  async list(userId: string, songId: string): Promise<ChordChartResponse[]> {
    await this.songs.requireOwned(userId, songId);
    const rows = await this.prisma.chordChart.findMany({
      where: { songId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toResponse);
  }

  async create(
    userId: string,
    songId: string,
    dto: CreateChordChartInput,
  ): Promise<ChordChartResponse> {
    await this.songs.requireOwned(userId, songId);
    const created = await this.prisma.chordChart.create({
      data: { songId, label: dto.label, content: dto.content },
    });
    return toResponse(created);
  }

  async update(
    userId: string,
    songId: string,
    id: string,
    dto: UpdateChordChartInput,
  ): Promise<ChordChartResponse> {
    await this.requireOwned(userId, songId, id);
    const updated = await this.prisma.chordChart.update({
      where: { id },
      data: { label: dto.label, content: dto.content },
    });
    return toResponse(updated);
  }

  async remove(userId: string, songId: string, id: string): Promise<void> {
    await this.requireOwned(userId, songId, id);
    await this.prisma.chordChart.delete({ where: { id } });
  }

  private async requireOwned(
    userId: string,
    songId: string,
    id: string,
  ): Promise<void> {
    await this.songs.requireOwned(userId, songId);
    const row = await this.prisma.chordChart.findFirst({
      where: { id, songId },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Chord chart not found');
  }
}
