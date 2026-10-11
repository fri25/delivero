import { Global, Module } from '@nestjs/common';
import { MediasController } from './medias.controller';
import { MediasService } from './medias.service';

// Global: the Colis and Courses express services validate photo URLs.
@Global()
@Module({
  controllers: [MediasController],
  providers: [MediasService],
  exports: [MediasService],
})
export class MediasModule {}
