import {
  createLyricVersionSchema,
  lyricVersionSchema,
  updateLyricVersionSchema,
} from '@monorepo/core';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class CreateLyricVersionDto extends createZodDto(
  createLyricVersionSchema,
) {}
export class UpdateLyricVersionDto extends createZodDto(
  updateLyricVersionSchema,
) {}
export class LyricVersionResponseDto extends createZodDto(
  lyricVersionSchema,
) {}
export class LyricVersionListDto extends createZodDto(
  z.array(lyricVersionSchema),
) {}
