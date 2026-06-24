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
import type { Tablature as TablatureResponse } from '@monorepo/core';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { TabsService } from './tabs.service';
import {
  CreateTablatureDto,
  TablatureListDto,
  TablatureResponseDto,
  UpdateTablatureDto,
} from './dto/tabs.dto';

@ApiTags('tabs')
@ApiBearerAuth()
@Controller('songs/:songId/tabs')
export class TabsController {
  constructor(private readonly tabs: TabsService) {}

  @Get()
  @ApiOperation({ summary: 'List a song\'s tablatures' })
  @ApiOkResponse({ type: TablatureListDto })
  list(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
  ): Promise<TablatureResponse[]> {
    return this.tabs.list(user.userId, songId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a tablature' })
  @ApiOkResponse({ type: TablatureResponseDto })
  create(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
    @Body() dto: CreateTablatureDto,
  ): Promise<TablatureResponse> {
    return this.tabs.create(user.userId, songId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tablature' })
  @ApiOkResponse({ type: TablatureResponseDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTablatureDto,
  ): Promise<TablatureResponse> {
    return this.tabs.update(user.userId, songId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a tablature' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('songId') songId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.tabs.remove(user.userId, songId, id);
  }
}
