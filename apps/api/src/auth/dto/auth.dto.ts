import {
  authTokensSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from '@monorepo/core';
import { createZodDto } from 'nestjs-zod';

export class RegisterDto extends createZodDto(registerSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class RefreshDto extends createZodDto(refreshSchema) {}
export class RequestPasswordResetDto extends createZodDto(
  requestPasswordResetSchema,
) {}
export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
export class AuthTokensDto extends createZodDto(authTokensSchema) {}
