import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ZonesService } from './zones.service';

// Public, en lecture seule : le choix de la zone de collecte (Colis) doit se
// faire avant que le client ait forcément fini de s'authentifier dans le
// formulaire, et une zone (id + nom) n'est pas une donnée sensible.
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Public()
  @Get()
  findAll() {
    return this.zonesService.findAllPublic();
  }
}
