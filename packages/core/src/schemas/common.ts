import { z } from 'zod';

/** Envelope returned by paginated list endpoints. */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Build a Zod schema for a paginated list of `item`. */
export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  });
}

/** A bare id param (used in path-param DTOs). */
export const idParamSchema = z.object({
  id: z.string(),
});
export type IdParam = z.infer<typeof idParamSchema>;
