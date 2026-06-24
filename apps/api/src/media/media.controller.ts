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
import type {
  MediaAsset as MediaAssetResponse,
  MediaUrlResult,
  PresignUploadResult,
} from '@monorepo/core';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { MediaService } from './media.service';
import {
  ConfirmUploadDto,
  MediaAssetListDto,
  MediaAssetResponseDto,
  MediaUrlResultDto,
  PresignUploadDto,
  PresignUploadResultDto,
} from './dto/media.dto';

@ApiTags('media')
@ApiBearerAuth()
@Controller()
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('media/presign')
  @ApiOperation({ summary: 'Get a presigned URL to upload media directly to storage' })
  @ApiOkResponse({ type: PresignUploadResultDto })
  presign(
    @CurrentUser() user: AuthUser,
    @Body() dto: PresignUploadDto,
  ): Promise<PresignUploadResult> {
    return this.media.presign(user.userId, dto);
  }

  @Post('media')
  @ApiOperation({ summary: 'Confirm an upload and persist its metadata' })
  @ApiOkResponse({ type: MediaAssetResponseDto })
  confirm(
    @CurrentUser() user: AuthUser,
    @Body() dto: ConfirmUploadDto,
  ): Promise<MediaAssetResponse> {
    return this.media.confirm(user.userId, dto);
  }

  @Get('media/:id/url')
  @ApiOperation({ summary: 'Get a short-lived signed URL for playback/download' })
  @ApiOkResponse({ type: MediaUrlResultDto })
  getUrl(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<MediaUrlResult> {
    return this.media.getUrl(user.userId, id);
  }

  @Delete('media/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a media asset and its stored object' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.media.remove(user.userId, id);
  }

  @Get('songs/:songId/media')
  @ApiOperation({ summary: 'List a song\'s media assets' })
  @ApiOkResponse({ type: MediaAssetListDto })
  listForSong(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
  ): Promise<MediaAssetResponse[]> {
    return this.media.listForSong(user.userId, songId);
  }

  @Get('collections/:collectionId/media')
  @ApiOperation({ summary: 'List a collection\'s media assets' })
  @ApiOkResponse({ type: MediaAssetListDto })
  listForCollection(
    @CurrentUser() user: AuthUser,
    @Param('collectionId') collectionId: string,
  ): Promise<MediaAssetResponse[]> {
    return this.media.listForCollection(user.userId, collectionId);
  }
}
