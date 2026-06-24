import { Module } from '@nestjs/common';
import { SongsModule } from '../songs/songs.module';
import { LyricsController } from './lyrics.controller';
import { LyricsService } from './lyrics.service';

@Module({
  imports: [SongsModule],
  controllers: [LyricsController],
  providers: [LyricsService],
})
export class LyricsModule {}
