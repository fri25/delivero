import {
  Body,
  Controller,
  Get,
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
import { ROLES_BACK_OFFICE } from '../auth/roles';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { InviterUtilisateurDto } from './dto/inviter-utilisateur.dto';
import { ModifierUtilisateurDto } from './dto/modifier-utilisateur.dto';
import { EntrepriseUtilisateursService } from './entreprise-utilisateurs.service';

@Controller('admin/entreprise/utilisateurs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ROLES_BACK_OFFICE)
@RequirePermissions('entreprise.utilisateurs')
export class EntrepriseUtilisateursController {
  constructor(private readonly service: EntrepriseUtilisateursService) {}

  @Get()
  lister() {
    return this.service.lister();
  }

  @Post()
  inviter(@Body() dto: InviterUtilisateurDto) {
    return this.service.inviter(dto);
  }

  @Patch(':id')
  modifier(
    @Param('id') id: string,
    @Body() dto: ModifierUtilisateurDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.modifier(id, dto, user.id);
  }
}
