import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { AdminCaisseService } from './admin-caisse.service';

const ADMIN_ROLE_NAME = 'admin_dispatcher';

@Controller('admin/caisse')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ADMIN_ROLE_NAME)
@RequirePermissions('caisse.rapprocher')
export class AdminCaisseController {
  constructor(private readonly adminCaisseService: AdminCaisseService) {}

  @Get('clotures')
  findAll() {
    return this.adminCaisseService.findAll();
  }

  @Patch('clotures/:id/rapprocher')
  rapprocher(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.adminCaisseService.rapprocher(id, user.id);
  }
}
