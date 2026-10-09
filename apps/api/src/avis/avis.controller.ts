import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { CreateAvisDto } from './dto/create-avis.dto';
import { AvisService } from './avis.service';

@Controller('commandes/:commandeId/avis')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('client')
export class AvisController {
  constructor(private readonly avisService: AvisService) {}

  @Get()
  findForClient(
    @CurrentUser() user: AuthenticatedUser,
    @Param('commandeId') commandeId: string,
  ) {
    return this.avisService.findForClient(user.id, commandeId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('commandeId') commandeId: string,
    @Body() dto: CreateAvisDto,
  ) {
    return this.avisService.create(user.id, commandeId, dto);
  }
}
