import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { CommandesColisService } from './commandes-colis.service';
import { CreateCommandeColisDto } from './dto/create-commande-colis.dto';
import { DeclarerLitigeColisDto } from './dto/declarer-litige-colis.dto';
import { EstimerColisDto } from './dto/estimer-colis.dto';
import { LivrerColisDto } from './dto/livrer-colis.dto';

@Controller('commandes/colis')
export class CommandesColisController {
  constructor(private readonly commandesColisService: CommandesColisService) {}

  @Get('estimation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  estimer(@Query() dto: EstimerColisDto) {
    return this.commandesColisService.estimer(dto.zoneId, dto.taille);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommandeColisDto,
  ) {
    return this.commandesColisService.create(user.id, dto);
  }

  @Get('mes-commandes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.commandesColisService.findAllForClient(user.id);
  }

  @Get('disponibles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('livreur')
  findDisponibles(@CurrentUser() user: AuthenticatedUser) {
    return this.commandesColisService.findDisponiblesPourLivreur(user.id);
  }

  @Get('mes-courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('livreur')
  findMesCourses(@CurrentUser() user: AuthenticatedUser) {
    return this.commandesColisService.findAllForLivreur(user.id);
  }

  // Suivi public par lien, sans compte (cahier des charges §6.2.2) : le cuid
  // Prisma sert directement de code de suivi, non séquentiel et non
  // devinable. Aucune authentification, endpoint volontairement en liste
  // blanche (voir SUIVI_PUBLIC_SELECT dans le service).
  @Public()
  @Get('suivi/:id')
  suivi(@Param('id') id: string) {
    return this.commandesColisService.suiviPublic(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commandesColisService.findOneForUser(user.id, user.role, id);
  }

  @Patch(':id/prendre-en-charge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('livreur')
  prendreEnCharge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.commandesColisService.prendreEnCharge(user.id, id);
  }

  @Patch(':id/recupere')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('livreur')
  marquerRecupere(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.commandesColisService.marquerRecupere(user.id, id);
  }

  @Patch(':id/en-route')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('livreur')
  marquerEnRoute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.commandesColisService.marquerEnRoute(user.id, id);
  }

  @Patch(':id/livraison')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('livreur')
  livrer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: LivrerColisDto,
  ) {
    return this.commandesColisService.livrer(user.id, id, dto);
  }

  @Patch(':id/litige')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('livreur')
  declarerLitige(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: DeclarerLitigeColisDto,
  ) {
    return this.commandesColisService.declarerLitige(user.id, id, dto);
  }

  @Patch(':id/annuler')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  annuler(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commandesColisService.annuler(user.id, id);
  }
}
