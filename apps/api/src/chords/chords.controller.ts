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
import type { ChordChart as ChordChartResponse } from '@monorepo/core';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { ChordsService } from './chords.service';
import {
  ChordChartListDto,
  ChordChartResponseDto,
  CreateChordChartDto,
  UpdateChordChartDto,
} from './dto/chords.dto';

@ApiTags('chords')
@ApiBearerAuth()
@Controller('songs/:songId/chords')
export class ChordsController {
  constructor(private readonly chords: ChordsService) {}

  @Get()
  @ApiOperation({ summary: 'List a song\'s chord charts' })
  @ApiOkResponse({ type: ChordChartListDto })
  list(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
  ): Promise<ChordChartResponse[]> {
    return this.chords.list(user.userId, songId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a chord chart' })
  @ApiOkResponse({ type: ChordChartResponseDto })
  create(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
    @Body() dto: CreateChordChartDto,
  ): Promise<ChordChartResponse> {
    return this.chords.create(user.userId, songId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a chord chart' })
  @ApiOkResponse({ type: ChordChartResponseDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
    @Param('id') id: string,
    @Body() dto: UpdateChordChartDto,
  ): Promise<ChordChartResponse> {
    return this.chords.update(user.userId, songId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a chord chart' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.chords.remove(user.userId, songId, id);
  }
}
