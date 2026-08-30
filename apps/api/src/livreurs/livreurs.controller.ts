import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { ClotureCaisseDto } from './dto/cloturer-caisse.dto';
import { ToggleDisponibiliteDto } from './dto/toggle-disponibilite.dto';
import { LivreursService } from './livreurs.service';

@Controller('livreurs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('livreur')
export class LivreursController {
  constructor(private readonly livreursService: LivreursService) {}

  @Get('me')
  getOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.livreursService.getOwn(user.id);
  }

  @Get('me/portefeuille')
  getPortefeuille(@CurrentUser() user: AuthenticatedUser) {
    return this.livreursService.getPortefeuille(user.id);
  }

  @Patch('me/disponibilite')
  toggleDisponibilite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ToggleDisponibiliteDto,
  ) {
    return this.livreursService.toggleDisponibilite(user.id, dto.disponible);
  }

  @Get('me/clotures-caisse')
  getClotures(@CurrentUser() user: AuthenticatedUser) {
    return this.livreursService.getClotures(user.id);
  }

  @Post('me/cloture-caisse')
  cloturerCaisse(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ClotureCaisseDto,
  ) {
    return this.livreursService.cloturerCaisse(user.id, dto.montantDeclare);
  }
}
