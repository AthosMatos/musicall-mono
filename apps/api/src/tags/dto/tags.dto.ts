import { applyTagSchema, createTagSchema, tagSchema } from '@monorepo/core';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class CreateTagDto extends createZodDto(createTagSchema) {}
export class ApplyTagDto extends createZodDto(applyTagSchema) {}
export class TagResponseDto extends createZodDto(tagSchema) {}
export class TagListDto extends createZodDto(z.array(tagSchema)) {}
