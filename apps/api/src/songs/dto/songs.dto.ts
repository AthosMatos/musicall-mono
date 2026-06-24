import {
  createSongSchema,
  paginated,
  songQuerySchema,
  songSchema,
  updateSongSchema,
} from '@monorepo/core';
import { createZodDto } from 'nestjs-zod';

export class CreateSongDto extends createZodDto(createSongSchema) {}
export class UpdateSongDto extends createZodDto(updateSongSchema) {}
export class SongQueryDto extends createZodDto(songQuerySchema) {}
export class SongResponseDto extends createZodDto(songSchema) {}
export class SongListDto extends createZodDto(paginated(songSchema)) {}
