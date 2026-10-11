import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { NoterCommandeDto } from './dto/noter-commande.dto';
import { NotationsService } from './notations.service';

// `:commandeId` is the generic Commande id, shared by the 4 services.
@Controller('notations/commandes/:commandeId')
@UseGuards(RolesGuard)
@Roles('client')
export class NotationsController {
  constructor(private readonly notationsService: NotationsService) {}

  @Post()
  noter(
    @CurrentUser() user: AuthenticatedUser,
    @Param('commandeId') commandeId: string,
    @Body() dto: NoterCommandeDto,
  ) {
    return this.notationsService.noterParClient(user.id, commandeId, dto);
  }
}
