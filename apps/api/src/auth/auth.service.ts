import { randomBytes } from 'node:crypto';
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { AuthTokens } from '@monorepo/core';
import * as argon2 from 'argon2';
import { AppConfigService } from '../config/app-config.service';
import { MailerService } from '../common/mailer/mailer.service';
import { PrismaService } from '../prisma/prisma.service';

const RESET_TOKEN_TYPE = 'pwd_reset';

interface ResetTokenPayload {
  sub: string;
  typ: typeof RESET_TOKEN_TYPE;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
    private readonly mailer: MailerService,
  ) {}

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthTokens> {
    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: { name, email, passwordHash },
    });
    return this.issueTokens(user.id, user.email);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user.id, user.email);
  }

  /** Rotate: validate the presented refresh token, revoke it, issue a new pair. */
  async refresh(rawToken: string | undefined): Promise<AuthTokens> {
    const record = await this.findValidRefreshToken(rawToken);
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: record.userId },
    });
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    return this.issueTokens(user.id, user.email);
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const [id] = rawToken.split('.');
    if (!id) return;
    await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always succeed silently to avoid leaking which emails are registered.
    if (!user) return;
    const token = await this.jwt.signAsync(
      { sub: user.id, typ: RESET_TOKEN_TYPE } satisfies ResetTokenPayload,
      { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: '1h' },
    );
    const resetUrl = `${this.config.get('WEB_ORIGIN')}/reset-password?token=${token}`;
    await this.mailer.sendPasswordReset({ to: email, resetToken: token, resetUrl });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    let payload: ResetTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<ResetTokenPayload>(token, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    if (payload.typ !== RESET_TOKEN_TYPE) {
      throw new UnauthorizedException('Invalid reset token');
    }
    const passwordHash = await argon2.hash(password);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: payload.sub },
        data: { passwordHash },
      }),
      // Invalidate every existing session.
      this.prisma.refreshToken.updateMany({
        where: { userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  private async issueTokens(
    userId: string,
    email: string,
  ): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get(
          'JWT_ACCESS_TTL',
        ) as JwtSignOptions['expiresIn'],
      },
    );
    const refreshToken = await this.createRefreshToken(userId);
    return { accessToken, refreshToken };
  }

  /** Opaque "selector.verifier" token: id locates the row, secret is hashed. */
  private async createRefreshToken(userId: string): Promise<string> {
    const secret = randomBytes(32).toString('hex');
    const tokenHash = await argon2.hash(secret);
    const expiresAt = new Date(
      Date.now() + parseDurationMs(this.config.get('JWT_REFRESH_TTL')),
    );
    const record = await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    return `${record.id}.${secret}`;
  }

  private async findValidRefreshToken(rawToken: string | undefined) {
    if (!rawToken) throw new UnauthorizedException('Missing refresh token');
    const [id, secret] = rawToken.split('.');
    if (!id || !secret) {
      throw new UnauthorizedException('Malformed refresh token');
    }
    const record = await this.prisma.refreshToken.findUnique({ where: { id } });
    if (
      !record ||
      record.revokedAt ||
      record.expiresAt.getTime() < Date.now() ||
      !(await argon2.verify(record.tokenHash, secret))
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return record;
  }
}

/** Parse durations like "15m", "30d", "1h", "3600s" into milliseconds. */
export function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return Number(value) || 0;
  const amount = Number(match[1]);
  const unit = match[2];
  const factor = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit]!;
  return amount * factor;
}
