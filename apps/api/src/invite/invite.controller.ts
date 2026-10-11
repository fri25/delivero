import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { NoterCommandeDto } from '../notations/dto/noter-commande.dto';
import {
  CreateCommandeColisInviteDto,
  CreateCommandeCoursesExpressInviteDto,
  CreateCommandeRepasInviteDto,
} from './dto/commande-invite.dto';
import { InviteService } from './invite.service';

// F-CLI-02: ordering without an account. Everything is public; an existing
// order is only reachable through its signed link `:jeton` (see
// JetonInviteService). Creation is throttled harder than the global limit:
// with no account and no verified number it is the main abuse surface —
// although paying at order time keeps unpaid orders from reaching anyone.
@Public()
@Controller('invite')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('commandes/repas')
  creerRepas(@Body() dto: CreateCommandeRepasInviteDto) {
    return this.inviteService.creerRepas(dto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('commandes/colis')
  creerColis(@Body() dto: CreateCommandeColisInviteDto) {
    return this.inviteService.creerColis(dto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('commandes/courses-express')
  creerCoursesExpress(@Body() dto: CreateCommandeCoursesExpressInviteDto) {
    return this.inviteService.creerCoursesExpress(dto);
  }

  @Get('suivi/:jeton')
  suivi(@Param('jeton') jeton: string) {
    return this.inviteService.suivi(jeton);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('suivi/:jeton/paiement/initier')
  @HttpCode(200)
  initierPaiement(@Param('jeton') jeton: string) {
    return this.inviteService.initierPaiement(jeton);
  }

  @Post('suivi/:jeton/paiement/synchroniser')
  @HttpCode(200)
  synchroniserPaiement(@Param('jeton') jeton: string) {
    return this.inviteService.synchroniserPaiement(jeton);
  }

  @Patch('suivi/:jeton/annuler')
  annuler(@Param('jeton') jeton: string) {
    return this.inviteService.annuler(jeton);
  }

  @Post('suivi/:jeton/notations')
  noter(@Param('jeton') jeton: string, @Body() dto: NoterCommandeDto) {
    return this.inviteService.noter(jeton, dto);
  }
}
