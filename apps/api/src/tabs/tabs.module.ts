import { Module } from '@nestjs/common';
import { SongsModule } from '../songs/songs.module';
import { TabsController } from './tabs.controller';
import { TabsService } from './tabs.service';

@Module({
  imports: [SongsModule],
  controllers: [TabsController],
  providers: [TabsService],
})
export class TabsModule {}
