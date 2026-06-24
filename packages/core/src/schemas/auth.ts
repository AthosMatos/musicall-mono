import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});
export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const avatarPresignSchema = z.object({
  mime: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});
export type AvatarPresignInput = z.infer<typeof avatarPresignSchema>;

export const setAvatarSchema = z.object({
  avatarKey: z.string().min(1),
});
export type SetAvatarInput = z.infer<typeof setAvatarSchema>;

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof userSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  // refreshToken is delivered via httpOnly cookie (web) or response body (mobile)
  refreshToken: z.string().optional(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

/** Mobile sends the refresh token explicitly; web relies on the httpOnly cookie. */
export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});
export type RefreshInput = z.infer<typeof refreshSchema>;
