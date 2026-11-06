import { Body, Controller, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ROLES_BACK_OFFICE } from '../auth/roles';
import { FedapayDto } from './dto/fedapay.dto';
import { ModifierParametresDto } from './dto/modifier-parametres.dto';
import { EntrepriseParametresService } from './entreprise-parametres.service';

@Controller('admin/entreprise')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ROLES_BACK_OFFICE)
@RequirePermissions('entreprise.parametres')
export class EntrepriseParametresController {
  constructor(private readonly service: EntrepriseParametresService) {}

  @Get('parametres')
  lire() {
    return this.service.lire();
  }

  @Patch('parametres')
  modifier(@Body() dto: ModifierParametresDto) {
    return this.service.modifier(dto);
  }

  @Put('fedapay')
  fedapay(@Body() dto: FedapayDto) {
    return this.service.enregistrerFedapay(dto);
  }
}
