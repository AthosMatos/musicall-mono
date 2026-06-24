import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type {
  Collection as CollectionResponse,
  PaginatedResult,
} from '@monorepo/core';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { CollectionsService } from './collections.service';
import {
  AddSongToCollectionDto,
  CollectionListDto,
  CollectionQueryDto,
  CollectionResponseDto,
  CreateCollectionDto,
  ReorderSongsDto,
  UpdateCollectionDto,
} from './dto/collections.dto';

@ApiTags('collections')
@ApiBearerAuth()
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  @ApiOperation({ summary: 'List collections with filters and pagination' })
  @ApiOkResponse({ type: CollectionListDto })
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: CollectionQueryDto,
  ): Promise<PaginatedResult<CollectionResponse>> {
    return this.collections.list(user.userId, query);
  }

  @Get('trash')
  @ApiOperation({ summary: 'List soft-deleted collections (trash)' })
  @ApiOkResponse({ type: CollectionListDto })
  listTrash(
    @CurrentUser() user: AuthUser,
    @Query() query: CollectionQueryDto,
  ): Promise<PaginatedResult<CollectionResponse>> {
    return this.collections.list(user.userId, { ...query, trashed: true });
  }

  @Post()
  @ApiOperation({ summary: 'Create a collection (album or single)' })
  @ApiOkResponse({ type: CollectionResponseDto })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCollectionDto,
  ): Promise<CollectionResponse> {
    return this.collections.create(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a collection by id' })
  @ApiOkResponse({ type: CollectionResponseDto })
  get(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<CollectionResponse> {
    return this.collections.get(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a collection (incl. cover)' })
  @ApiOkResponse({ type: CollectionResponseDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
  ): Promise<CollectionResponse> {
    return this.collections.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Move a collection to the trash (soft delete)' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.collections.softDelete(user.userId, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a collection from the trash' })
  @ApiOkResponse({ type: CollectionResponseDto })
  restore(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<CollectionResponse> {
    return this.collections.restore(user.userId, id);
  }

  @Delete(':id/purge')
  @HttpCode(204)
  @ApiOperation({ summary: 'Permanently delete a collection and its media' })
  purge(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.collections.purge(user.userId, id);
  }

  @Post(':id/songs')
  @HttpCode(204)
  @ApiOperation({ summary: 'Add a song to the collection' })
  addSong(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddSongToCollectionDto,
  ): Promise<void> {
    return this.collections.addSong(user.userId, id, dto.songId);
  }

  @Delete(':id/songs/:songId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a song from the collection' })
  removeSong(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('songId') songId: string,
  ): Promise<void> {
    return this.collections.removeSong(user.userId, id, songId);
  }

  @Put(':id/songs/order')
  @HttpCode(204)
  @ApiOperation({ summary: 'Reorder the tracks in the collection' })
  reorder(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReorderSongsDto,
  ): Promise<void> {
    return this.collections.reorder(user.userId, id, dto.songIds);
  }
}
