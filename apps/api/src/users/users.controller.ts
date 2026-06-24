import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type {
  PresignUploadResult,
  User as UserResponse,
} from '@monorepo/core';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { UsersService } from './users.service';
import {
  AvatarPresignDto,
  PresignUploadResultDto,
  SetAvatarDto,
  UpdateProfileDto,
  UserResponseDto,
} from './dto/users.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users/me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  getMe(@CurrentUser() user: AuthUser): Promise<UserResponse> {
    return this.users.getMe(user.userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update name/email' })
  @ApiOkResponse({ type: UserResponseDto })
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponse> {
    return this.users.updateMe(user.userId, dto);
  }

  @Post('avatar/presign')
  @ApiOperation({ summary: 'Get a presigned URL to upload a profile photo' })
  @ApiOkResponse({ type: PresignUploadResultDto })
  presignAvatar(
    @CurrentUser() user: AuthUser,
    @Body() dto: AvatarPresignDto,
  ): Promise<PresignUploadResult> {
    return this.users.presignAvatar(user.userId, dto.mime);
  }

  @Patch('avatar')
  @ApiOperation({ summary: 'Set the profile photo to a previously uploaded object' })
  @ApiOkResponse({ type: UserResponseDto })
  setAvatar(
    @CurrentUser() user: AuthUser,
    @Body() dto: SetAvatarDto,
  ): Promise<UserResponse> {
    return this.users.setAvatar(user.userId, dto.avatarKey);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export all personal data as JSON (LGPD)' })
  exportData(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.users.exportData(user.userId);
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete the account and all associated data (LGPD)' })
  deleteMe(@CurrentUser() user: AuthUser): Promise<void> {
    return this.users.deleteMe(user.userId);
  }
}
