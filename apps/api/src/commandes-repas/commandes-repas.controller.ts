import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { CommandesRepasService } from './commandes-repas.service';
import { CreateCommandeRepasDto } from './dto/create-commande-repas.dto';
import { RefuserCommandeDto } from './dto/refuser-commande.dto';

@Controller('commandes/repas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommandesRepasController {
  constructor(private readonly commandesRepasService: CommandesRepasService) {}

  @Post()
  @Roles('client')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommandeRepasDto,
  ) {
    return this.commandesRepasService.create(user.id, dto);
  }

  @Get('mes-commandes')
  @Roles('client')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.commandesRepasService.findAllForClient(user.id);
  }

  @Get('disponibles')
  @Roles('livreur')
  findDisponibles(@CurrentUser() user: AuthenticatedUser) {
    return this.commandesRepasService.findDisponiblesPourLivreur(user.id);
  }

  @Get('mes-courses')
  @Roles('livreur')
  findMesCourses(@CurrentUser() user: AuthenticatedUser) {
    return this.commandesRepasService.findAllForLivreur(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commandesRepasService.findOneForUser(user.id, user.role, id);
  }

  @Patch(':id/accepter')
  @Roles('restaurant')
  accepter(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commandesRepasService.accepter(user.id, id);
  }

  @Patch(':id/refuser')
  @Roles('restaurant')
  refuser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RefuserCommandeDto,
  ) {
    return this.commandesRepasService.refuser(user.id, id, dto.motif);
  }

  @Patch(':id/preparation')
  @Roles('restaurant')
  marquerEnPreparation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.commandesRepasService.marquerEnPreparation(user.id, id);
  }

  @Patch(':id/prete')
  @Roles('restaurant')
  marquerPrete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.commandesRepasService.marquerPrete(user.id, id);
  }

  @Patch(':id/annuler')
  @Roles('client')
  annuler(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commandesRepasService.annuler(user.id, id);
  }

  @Patch(':id/prendre-en-charge')
  @Roles('livreur')
  prendreEnCharge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.commandesRepasService.prendreEnCharge(user.id, id);
  }

  @Patch(':id/en-route')
  @Roles('livreur')
  marquerEnRoute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.commandesRepasService.marquerEnRoute(user.id, id);
  }

  @Patch(':id/livree')
  @Roles('livreur')
  marquerLivree(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.commandesRepasService.marquerLivree(user.id, id);
  }
}
