import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type {
  PaginatedResult,
  Song as SongResponse,
} from '@monorepo/core';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { SongsService } from './songs.service';
import {
  CreateSongDto,
  SongListDto,
  SongQueryDto,
  SongResponseDto,
  UpdateSongDto,
} from './dto/songs.dto';

@ApiTags('songs')
@ApiBearerAuth()
@Controller('songs')
export class SongsController {
  constructor(private readonly songs: SongsService) {}

  @Get()
  @ApiOperation({ summary: 'List songs with search, filters, sort, pagination' })
  @ApiOkResponse({ type: SongListDto })
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: SongQueryDto,
  ): Promise<PaginatedResult<SongResponse>> {
    return this.songs.list(user.userId, query);
  }

  @Get('trash')
  @ApiOperation({ summary: 'List soft-deleted songs (trash)' })
  @ApiOkResponse({ type: SongListDto })
  listTrash(
    @CurrentUser() user: AuthUser,
    @Query() query: SongQueryDto,
  ): Promise<PaginatedResult<SongResponse>> {
    return this.songs.list(user.userId, { ...query, trashed: true });
  }

  @Post()
  @ApiOperation({ summary: 'Create a song' })
  @ApiOkResponse({ type: SongResponseDto })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSongDto,
  ): Promise<SongResponse> {
    return this.songs.create(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a song by id' })
  @ApiOkResponse({ type: SongResponseDto })
  get(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<SongResponse> {
    return this.songs.get(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a song (metadata, favorite, cover)' })
  @ApiOkResponse({ type: SongResponseDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSongDto,
  ): Promise<SongResponse> {
    return this.songs.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Move a song to the trash (soft delete)' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.songs.softDelete(user.userId, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a song (independent copy)' })
  @ApiOkResponse({ type: SongResponseDto })
  duplicate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<SongResponse> {
    return this.songs.duplicate(user.userId, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a song from the trash' })
  @ApiOkResponse({ type: SongResponseDto })
  restore(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<SongResponse> {
    return this.songs.restore(user.userId, id);
  }

  @Delete(':id/purge')
  @HttpCode(204)
  @ApiOperation({ summary: 'Permanently delete a song and its media' })
  purge(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.songs.purge(user.userId, id);
  }
}
