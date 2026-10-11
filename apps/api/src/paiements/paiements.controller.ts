import { Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { PaiementsService } from './paiements.service';

// `:commandeId` is the generic Commande id (commande.commande.id on the
// client), shared by the 4 services.
@Controller('paiements/commandes/:commandeId')
@UseGuards(RolesGuard)
@Roles('client')
export class PaiementsController {
  constructor(private readonly paiementsService: PaiementsService) {}

  // Each call may create a FedaPay transaction: keep it well below the
  // global limit.
  @Post('initier')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  initier(
    @CurrentUser() user: AuthenticatedUser,
    @Param('commandeId') commandeId: string,
  ) {
    return this.paiementsService.initier(user.id, commandeId);
  }

  @Post('synchroniser')
  @HttpCode(200)
  synchroniser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('commandeId') commandeId: string,
  ) {
    return this.paiementsService.synchroniser(user.id, commandeId);
  }
}
