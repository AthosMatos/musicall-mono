import { Injectable } from '@nestjs/common';
import { log } from '@monorepo/logger';

export interface PasswordResetEmail {
  to: string;
  resetToken: string;
  resetUrl: string;
}

/**
 * Mailer abstraction. The dev implementation just logs — no SMTP provider is
 * wired yet. Swap in a real transport (Resend/Nodemailer) behind this interface.
 */
@Injectable()
export class MailerService {
  async sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    log(
      `[mailer] password reset for ${email.to}: ${email.resetUrl} (token=${email.resetToken})`,
    );
  }
}
