import { Module } from '@nestjs/common';
import { LivreursController } from './livreurs.controller';
import { LivreursService } from './livreurs.service';

@Module({
  controllers: [LivreursController],
  providers: [LivreursService],
  exports: [LivreursService],
})
export class LivreursModule {}
