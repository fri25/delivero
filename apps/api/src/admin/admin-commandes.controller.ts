import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminCommandesService } from './admin-commandes.service';
import { AttribuerCommandeDto } from './dto/attribuer-commande.dto';
import { ListCommandesDto } from './dto/list-commandes.dto';

const ADMIN_ROLE_NAME = 'admin_dispatcher';

@Controller('admin/commandes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ADMIN_ROLE_NAME)
export class AdminCommandesController {
  constructor(private readonly adminCommandesService: AdminCommandesService) {}

  @RequirePermissions('commandes.consulter_toutes')
  @Get()
  findAll(@Query() dto: ListCommandesDto) {
    return this.adminCommandesService.findAll(dto);
  }

  @RequirePermissions('commandes.attribuer')
  @Patch(':id/attribuer')
  attribuer(@Param('id') id: string, @Body() dto: AttribuerCommandeDto) {
    return this.adminCommandesService.attribuer(id, dto);
  }
}
