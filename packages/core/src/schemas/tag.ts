import { z } from 'zod';

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Tag = z.infer<typeof tagSchema>;

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
});
export type CreateTagInput = z.infer<typeof createTagSchema>;

/** Apply an existing tag to a song. */
export const applyTagSchema = z.object({
  tagId: z.string(),
});
export type ApplyTagInput = z.infer<typeof applyTagSchema>;
