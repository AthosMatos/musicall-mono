import {
  addSongToCollectionSchema,
  collectionQuerySchema,
  collectionSchema,
  createCollectionSchema,
  paginated,
  reorderSongsSchema,
  updateCollectionSchema,
} from '@monorepo/core';
import { createZodDto } from 'nestjs-zod';

export class CreateCollectionDto extends createZodDto(createCollectionSchema) {}
export class UpdateCollectionDto extends createZodDto(updateCollectionSchema) {}
export class CollectionQueryDto extends createZodDto(collectionQuerySchema) {}
export class AddSongToCollectionDto extends createZodDto(
  addSongToCollectionSchema,
) {}
export class ReorderSongsDto extends createZodDto(reorderSongsSchema) {}
export class CollectionResponseDto extends createZodDto(collectionSchema) {}
export class CollectionListDto extends createZodDto(
  paginated(collectionSchema),
) {}
