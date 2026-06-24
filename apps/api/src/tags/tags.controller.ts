import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Tag as TagResponse } from '@monorepo/core';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { TagsService } from './tags.service';
import {
  ApplyTagDto,
  CreateTagDto,
  TagListDto,
  TagResponseDto,
} from './dto/tags.dto';

@ApiTags('tags')
@ApiBearerAuth()
@Controller()
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Get('tags')
  @ApiOperation({ summary: 'List the user\'s tags' })
  @ApiOkResponse({ type: TagListDto })
  list(@CurrentUser() user: AuthUser): Promise<TagResponse[]> {
    return this.tags.list(user.userId);
  }

  @Post('tags')
  @ApiOperation({ summary: 'Create a tag' })
  @ApiOkResponse({ type: TagResponseDto })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTagDto,
  ): Promise<TagResponse> {
    return this.tags.create(user.userId, dto.name);
  }

  @Delete('tags/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a tag' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.tags.remove(user.userId, id);
  }

  @Post('songs/:songId/tags')
  @HttpCode(204)
  @ApiOperation({ summary: 'Apply a tag to a song' })
  apply(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
    @Body() dto: ApplyTagDto,
  ): Promise<void> {
    return this.tags.applyToSong(user.userId, songId, dto.tagId);
  }

  @Delete('songs/:songId/tags/:tagId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a tag from a song' })
  removeFromSong(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
    @Param('tagId') tagId: string,
  ): Promise<void> {
    return this.tags.removeFromSong(user.userId, songId, tagId);
  }
}
