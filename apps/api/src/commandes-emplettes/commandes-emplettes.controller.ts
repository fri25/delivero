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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { CommandesEmplettesService } from './commandes-emplettes.service';
import { CreateCommandeEmplettesDto } from './dto/create-commande-emplettes.dto';
import { DeclarerLitigeEmplettesDto } from './dto/declarer-litige-emplettes.dto';
import { EstimerEmplettesDto } from './dto/estimer-emplettes.dto';
import { PointerArticleDto } from './dto/pointer-article.dto';
import { TerminerAchatsDto } from './dto/terminer-achats.dto';
import { ValiderDepassementDto } from './dto/valider-depassement.dto';

@Controller('commandes/emplettes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommandesEmplettesController {
  constructor(
    private readonly commandesEmplettesService: CommandesEmplettesService,
  ) {}

  @Get('estimation')
  @Roles('client')
  estimer(@Query() dto: EstimerEmplettesDto) {
    return this.commandesEmplettesService.estimer(dto.zoneId, dto.budgetMax);
  }

  @Post()
  @Roles('client')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommandeEmplettesDto,
  ) {
    return this.commandesEmplettesService.create(user.id, dto);
  }

  @Get('mes-commandes')
  @Roles('client')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.commandesEmplettesService.findAllForClient(user.id);
  }

  @Get('disponibles')
  @Roles('livreur')
  findDisponibles(@CurrentUser() user: AuthenticatedUser) {
    return this.commandesEmplettesService.findDisponiblesPourLivreur(user.id);
  }

  @Get('mes-courses')
  @Roles('livreur')
  findMesCourses(@CurrentUser() user: AuthenticatedUser) {
    return this.commandesEmplettesService.findAllForLivreur(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commandesEmplettesService.findOneForUser(
      user.id,
      user.role,
      id,
    );
  }

  @Patch(':id/prendre-en-charge')
  @Roles('livreur')
  prendreEnCharge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.commandesEmplettesService.prendreEnCharge(user.id, id);
  }

  @Patch(':id/articles/:articleId/pointer')
  @Roles('livreur')
  pointerArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('articleId') articleId: string,
    @Body() dto: PointerArticleDto,
  ) {
    return this.commandesEmplettesService.pointerArticle(
      user.id,
      id,
      articleId,
      dto,
    );
  }

  @Patch(':id/valider-depassement')
  @Roles('client')
  validerDepassement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ValiderDepassementDto,
  ) {
    return this.commandesEmplettesService.validerDepassement(user.id, id, dto);
  }

  @Patch(':id/achats-termines')
  @Roles('livreur')
  terminerAchats(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: TerminerAchatsDto,
  ) {
    return this.commandesEmplettesService.terminerAchats(user.id, id, dto);
  }

  @Patch(':id/en-route')
  @Roles('livreur')
  marquerEnRoute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.commandesEmplettesService.marquerEnRoute(user.id, id);
  }

  @Patch(':id/livree')
  @Roles('livreur')
  marquerLivree(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.commandesEmplettesService.marquerLivree(user.id, id);
  }

  @Patch(':id/litige')
  @Roles('livreur')
  declarerLitige(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: DeclarerLitigeEmplettesDto,
  ) {
    return this.commandesEmplettesService.declarerLitige(user.id, id, dto);
  }

  @Patch(':id/annuler')
  @Roles('client')
  annuler(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commandesEmplettesService.annuler(user.id, id);
  }
}
