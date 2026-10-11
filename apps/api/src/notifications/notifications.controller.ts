import { Body, Controller, Delete, Get, HttpCode, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import {
  AbonnementPushDto,
  DesabonnementPushDto,
} from './dto/abonnement-push.dto';
import { NotificationsService } from './notifications.service';

// Any authenticated role may subscribe: clients today, partners and livreurs
// once their apps ask for permission too.
@Controller('notifications/push')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Public: the browser needs it before asking the user for permission.
  // null => push disabled server-side, the app does not offer it.
  @Public()
  @Get('cle-publique')
  clePublique() {
    return { clePublique: this.notificationsService.clePubliquePush() };
  }

  @Post('abonnements')
  @HttpCode(204)
  abonner(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AbonnementPushDto,
  ) {
    return this.notificationsService.abonner(user.id, dto);
  }

  @Delete('abonnements')
  @HttpCode(204)
  desabonner(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DesabonnementPushDto,
  ) {
    return this.notificationsService.desabonner(user.id, dto.endpoint);
  }
}
