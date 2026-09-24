import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminSaisieManuelleService } from './admin-saisie-manuelle.service';
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
  ) {}

  @Post('repas')
  repas(@Body() dto: SaisieManuelleRepasDto) {
    return this.adminSaisieManuelleService.saisirRepas(dto);
  }

  @Post('colis')
  colis(@Body() dto: SaisieManuelleColisDto) {
    return this.adminSaisieManuelleService.saisirColis(dto);
  }

  @Post('emplettes')
  emplettes(@Body() dto: SaisieManuelleEmplettesDto) {
    return this.adminSaisieManuelleService.saisirEmplettes(dto);
  }

  @Post('courses-express')
  coursesExpress(@Body() dto: SaisieManuelleCoursesExpressDto) {
    return this.adminSaisieManuelleService.saisirCoursesExpress(dto);
  }
}
