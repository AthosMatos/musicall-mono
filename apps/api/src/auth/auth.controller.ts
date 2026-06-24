import type { AuthTokens } from '@monorepo/core';
import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AppConfigService } from '../config/app-config.service';
import { AuthService, parseDurationMs } from './auth.service';
import {
  AuthTokensDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/auth.dto';

const REFRESH_COOKIE = 'refreshToken';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: AppConfigService,
  ) { }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Create an account and start a session' })
  @ApiOkResponse({ type: AuthTokensDto })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokens> {
    try {
      const tokens = await this.auth.register(dto.name, dto.email, dto.password);
      this.setRefreshCookie(res, tokens.refreshToken);
      return tokens;
    }
    catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate and start a session' })
  @ApiOkResponse({ type: AuthTokensDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokens> {
    const tokens = await this.auth.login(dto.email, dto.password);
    this.setRefreshCookie(res, tokens.refreshToken);
    return tokens;
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate the refresh token and issue a new access token' })
  @ApiOkResponse({ type: AuthTokensDto })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokens> {
    const raw = this.readRefreshToken(req, dto);
    const tokens = await this.auth.refresh(raw);
    this.setRefreshCookie(res, tokens.refreshToken);
    return tokens;
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke the current refresh token' })
  async logout(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logout(this.readRefreshToken(req, dto));
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }

  @Public()
  @Post('password/forgot')
  @HttpCode(202)
  @ApiOperation({ summary: 'Request a password-reset email' })
  async forgot(@Body() dto: RequestPasswordResetDto): Promise<void> {
    await this.auth.requestPasswordReset(dto.email);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(204)
  @ApiOperation({ summary: 'Set a new password using a reset token' })
  async reset(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto.token, dto.password);
  }

  private readRefreshToken(req: Request, dto: RefreshDto): string | undefined {
    const cookies = (req as Request & { cookies?: Record<string, string> })
      .cookies;
    return cookies?.[REFRESH_COOKIE] ?? dto.refreshToken;
  }

  private setRefreshCookie(res: Response, token: string | undefined): void {
    if (!token) return;
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: parseDurationMs(this.config.get('JWT_REFRESH_TTL')),
    });
  }
}
