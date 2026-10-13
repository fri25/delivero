import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { AdminIncidentsService } from './admin-incidents.service';
import { AnnulerCommandeDto } from './dto/annuler-commande.dto';
import { RembourserDto } from './dto/rembourser.dto';

const ADMIN_ROLE_NAME = 'admin_dispatcher';

// F-ADM-06: cancellation by the dispatcher and manual refunds.
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ADMIN_ROLE_NAME)
@RequirePermissions('incidents.traiter')
export class AdminIncidentsController {
  constructor(private readonly incidents: AdminIncidentsService) {}

  @Patch('commandes/:id/annuler')
  annuler(
    @Param('id') id: string,
    @Body() dto: AnnulerCommandeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidents.annuler(id, dto, user.id);
  }

  @Get('remboursements')
  lister() {
    return this.incidents.listerRemboursements();
  }

  @Patch('remboursements/:id')
  rembourser(
    @Param('id') id: string,
    @Body() dto: RembourserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidents.rembourser(id, dto, user.id);
  }
}
