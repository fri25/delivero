import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { PaiementsService } from '../paiements/paiements.service';
import { AdminSaisieManuelleService } from './admin-saisie-manuelle.service';
import { PaiementRecuDto } from './dto/paiement-recu.dto';
import { SaisieManuelleColisDto } from './dto/saisie-manuelle-colis.dto';
import { SaisieManuelleCoursesExpressDto } from './dto/saisie-manuelle-courses-express.dto';
import { SaisieManuelleEmplettesDto } from './dto/saisie-manuelle-emplettes.dto';
import { SaisieManuelleRepasDto } from './dto/saisie-manuelle-repas.dto';

const ADMIN_ROLE_NAME = 'admin_dispatcher';

@Controller('admin/saisie-manuelle')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ADMIN_ROLE_NAME)
@RequirePermissions('commandes.saisir_manuelle')
export class AdminSaisieManuelleController {
  constructor(
    private readonly adminSaisieManuelleService: AdminSaisieManuelleService,
    private readonly paiements: PaiementsService,
  ) {}

  @Post('repas')
  repas(
    @Body() dto: SaisieManuelleRepasDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminSaisieManuelleService.saisirRepas(dto, user.id);
  }

  @Post('colis')
  colis(
    @Body() dto: SaisieManuelleColisDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminSaisieManuelleService.saisirColis(dto, user.id);
  }

  @Post('emplettes')
  emplettes(
    @Body() dto: SaisieManuelleEmplettesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminSaisieManuelleService.saisirEmplettes(dto, user.id);
  }

  @Post('courses-express')
  coursesExpress(
    @Body() dto: SaisieManuelleCoursesExpressDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminSaisieManuelleService.saisirCoursesExpress(dto, user.id);
  }

  // The client sent Mobile Money to the ChapExpress number: the dispatcher
  // confirms receipt and the order goes out (decision of 2026-10-13).
  @Patch('commandes/:id/paiement-recu')
  paiementRecu(
    @Param('id') id: string,
    @Body() dto: PaiementRecuDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paiements.confirmerManuellement(id, dto.reference, user.id);
  }
}
