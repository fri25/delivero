import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ROLES_BACK_OFFICE } from '../auth/roles';
import { ListerClientsDto } from './dto/lister-clients.dto';
import { ListerJournalDto } from './dto/lister-journal.dto';
import { EntrepriseClientsService } from './entreprise-clients.service';
import { EntrepriseJournalService } from './entreprise-journal.service';

@Controller('admin/entreprise')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ROLES_BACK_OFFICE)
export class EntrepriseActiviteController {
  constructor(
    private readonly journal: EntrepriseJournalService,
    private readonly clients: EntrepriseClientsService,
  ) {}

  @Get('journal')
  @RequirePermissions('journal.consulter')
  lireJournal(@Query() filtre: ListerJournalDto) {
    return this.journal.lister(filtre);
  }

  @Get('clients')
  @RequirePermissions('clients.consulter')
  listerClients(@Query() filtre: ListerClientsDto) {
    return this.clients.lister(filtre);
  }
}
