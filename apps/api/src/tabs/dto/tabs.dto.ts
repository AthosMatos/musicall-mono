import {
  createTablatureSchema,
  tablatureSchema,
  updateTablatureSchema,
} from '@monorepo/core';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class CreateTablatureDto extends createZodDto(createTablatureSchema) {}
export class UpdateTablatureDto extends createZodDto(updateTablatureSchema) {}
export class TablatureResponseDto extends createZodDto(tablatureSchema) {}
export class TablatureListDto extends createZodDto(z.array(tablatureSchema)) {}
