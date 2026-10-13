import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminStatistiquesService } from './admin-statistiques.service';
import { StatistiquesDto } from './dto/statistiques.dto';

const ADMIN_ROLE_NAME = 'admin_dispatcher';

@Controller('admin/statistiques')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ADMIN_ROLE_NAME)
@RequirePermissions('statistiques.consulter_tout')
export class AdminStatistiquesController {
  constructor(private readonly statistiques: AdminStatistiquesService) {}

  @Get()
  calculer(@Query() dto: StatistiquesDto) {
    return this.statistiques.calculer(dto.periode ?? 'jour');
  }
}
