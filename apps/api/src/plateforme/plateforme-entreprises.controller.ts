import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { AbonnementDto } from './dto/abonnement.dto';
import { CreerEntrepriseDto } from './dto/creer-entreprise.dto';
import { DomaineDto } from './dto/domaine.dto';
import { FonctionnalitesDto } from './dto/fonctionnalites.dto';
import { JournalPlateformeDto } from './dto/journal-plateforme.dto';
import { ModifierEntrepriseDto } from './dto/modifier-entreprise.dto';
import { PlateformeAuthGuard } from './plateforme-auth.guard';
import { PlateformeEntreprisesService } from './plateforme-entreprises.service';
import { PlateformeJournalService } from './plateforme-journal.service';

/**
 * Super-admin API (étape 9), platform context only (TenantMiddleware).
 * @Public() only lifts the global company guard (JwtAuthGuard, which
 * refuses platform sessions): PlateformeAuthGuard authenticates instead.
 */
@Controller('plateforme')
@Public()
@UseGuards(PlateformeAuthGuard)
export class PlateformeEntreprisesController {
  constructor(
    private readonly entreprises: PlateformeEntreprisesService,
    private readonly journal: PlateformeJournalService,
  ) {}

  @Get('entreprises')
  lister() {
    return this.entreprises.lister();
  }

  @Post('entreprises')
  creer(@Body() dto: CreerEntrepriseDto) {
    return this.entreprises.creer(dto);
  }

  @Get('entreprises/:id')
  detail(@Param('id') id: string) {
    return this.entreprises.detail(id);
  }

  @Patch('entreprises/:id')
  modifier(@Param('id') id: string, @Body() dto: ModifierEntrepriseDto) {
    return this.entreprises.modifier(id, dto);
  }

  @Put('entreprises/:id/fonctionnalites')
  fonctionnalites(@Param('id') id: string, @Body() dto: FonctionnalitesDto) {
    return this.entreprises.fonctionnalites(id, dto);
  }

  @Put('entreprises/:id/abonnement')
  abonnement(@Param('id') id: string, @Body() dto: AbonnementDto) {
    return this.entreprises.abonnement(id, dto);
  }

  @Post('entreprises/:id/domaines')
  ajouterDomaine(@Param('id') id: string, @Body() dto: DomaineDto) {
    return this.entreprises.ajouterDomaine(id, dto);
  }

  @Delete('entreprises/:id/domaines/:domaineId')
  retirerDomaine(
    @Param('id') id: string,
    @Param('domaineId') domaineId: string,
  ) {
    return this.entreprises.retirerDomaine(id, domaineId);
  }

  @Post('entreprises/:id/domaines/:domaineId/verification')
  verifierDomaine(
    @Param('id') id: string,
    @Param('domaineId') domaineId: string,
  ) {
    return this.entreprises.verifierDomaine(id, domaineId);
  }

  @Get('offres')
  offres() {
    return this.entreprises.offres();
  }

  @Get('journal')
  lireJournal(@Query() filtre: JournalPlateformeDto) {
    return this.journal.lister(filtre);
  }
}
