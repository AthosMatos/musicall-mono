import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { LyricVersion as LyricVersionResponse } from '@monorepo/core';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { LyricsService } from './lyrics.service';
import {
  CreateLyricVersionDto,
  LyricVersionListDto,
  LyricVersionResponseDto,
  UpdateLyricVersionDto,
} from './dto/lyrics.dto';

@ApiTags('lyrics')
@ApiBearerAuth()
@Controller('songs/:songId/lyrics')
export class LyricsController {
  constructor(private readonly lyrics: LyricsService) {}

  @Get()
  @ApiOperation({ summary: 'List a song\'s lyric versions' })
  @ApiOkResponse({ type: LyricVersionListDto })
  list(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
  ): Promise<LyricVersionResponse[]> {
    return this.lyrics.list(user.userId, songId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a lyric version' })
  @ApiOkResponse({ type: LyricVersionResponseDto })
  create(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
    @Body() dto: CreateLyricVersionDto,
  ): Promise<LyricVersionResponse> {
    return this.lyrics.create(user.userId, songId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lyric version' })
  @ApiOkResponse({ type: LyricVersionResponseDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLyricVersionDto,
  ): Promise<LyricVersionResponse> {
    return this.lyrics.update(user.userId, songId, id, dto);
  }

  @Post(':id/primary')
  @ApiOperation({ summary: 'Mark a lyric version as the primary/current one' })
  @ApiOkResponse({ type: LyricVersionResponseDto })
  setPrimary(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
    @Param('id') id: string,
  ): Promise<LyricVersionResponse> {
    return this.lyrics.setPrimary(user.userId, songId, id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a lyric version' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.lyrics.remove(user.userId, songId, id);
  }
}
