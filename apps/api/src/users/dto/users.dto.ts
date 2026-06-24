import {
  avatarPresignSchema,
  presignUploadResultSchema,
  setAvatarSchema,
  updateProfileSchema,
  userSchema,
} from '@monorepo/core';
import { createZodDto } from 'nestjs-zod';

export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}
export class AvatarPresignDto extends createZodDto(avatarPresignSchema) {}
export class SetAvatarDto extends createZodDto(setAvatarSchema) {}
export class UserResponseDto extends createZodDto(userSchema) {}
export class PresignUploadResultDto extends createZodDto(
  presignUploadResultSchema,
) {}
