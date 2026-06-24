import {
  chordChartSchema,
  createChordChartSchema,
  updateChordChartSchema,
} from '@monorepo/core';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class CreateChordChartDto extends createZodDto(createChordChartSchema) {}
export class UpdateChordChartDto extends createZodDto(updateChordChartSchema) {}
export class ChordChartResponseDto extends createZodDto(chordChartSchema) {}
export class ChordChartListDto extends createZodDto(
  z.array(chordChartSchema),
) {}
