import { Module } from '@nestjs/common';
import { SongsModule } from '../songs/songs.module';
import { ChordsController } from './chords.controller';
import { ChordsService } from './chords.service';

@Module({
  imports: [SongsModule],
  controllers: [ChordsController],
  providers: [ChordsService],
})
export class ChordsModule {}
