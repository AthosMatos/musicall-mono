import {
  confirmUploadSchema,
  mediaAssetSchema,
  mediaUrlResultSchema,
  presignUploadResultSchema,
  presignUploadSchema,
} from '@monorepo/core';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class PresignUploadDto extends createZodDto(presignUploadSchema) {}
export class ConfirmUploadDto extends createZodDto(confirmUploadSchema) {}
export class PresignUploadResultDto extends createZodDto(
  presignUploadResultSchema,
) {}
export class MediaUrlResultDto extends createZodDto(mediaUrlResultSchema) {}
export class MediaAssetResponseDto extends createZodDto(mediaAssetSchema) {}
export class MediaAssetListDto extends createZodDto(
  z.array(mediaAssetSchema),
) {}
