import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from './auth/auth.module';
import { ChordsModule } from './chords/chords.module';
import { CollectionsModule } from './collections/collections.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { MailerModule } from './common/mailer/mailer.module';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { LyricsModule } from './lyrics/lyrics.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { SongsModule } from './songs/songs.module';
import { StorageModule } from './storage/storage.module';
import { TabsModule } from './tabs/tabs.module';
import { TagsModule } from './tags/tags.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    StorageModule,
    MailerModule,
    AuthModule,
    UsersModule,
    SongsModule,
    LyricsModule,
    ChordsModule,
    TabsModule,
    MediaModule,
    CollectionsModule,
    TagsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
