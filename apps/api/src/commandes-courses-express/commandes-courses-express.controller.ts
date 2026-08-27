import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { CommandesCoursesExpressService } from './commandes-courses-express.service';
import { CreateCommandeCoursesExpressDto } from './dto/create-commande-courses-express.dto';
import { DeclarerLitigeCoursesExpressDto } from './dto/declarer-litige-courses-express.dto';
import { EstimerCoursesExpressDto } from './dto/estimer-courses-express.dto';

@Controller('commandes/courses-express')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommandesCoursesExpressController {
  constructor(
    private readonly commandesCoursesExpressService: CommandesCoursesExpressService,
  ) {}

  @Get('estimation')
  @Roles('client')
  estimer(@Query() dto: EstimerCoursesExpressDto) {
    return this.commandesCoursesExpressService.estimer(
      dto.zoneId,
      dto.nombreEtapes,
    );
  }

  @Post()
  @Roles('client')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommandeCoursesExpressDto,
  ) {
    return this.commandesCoursesExpressService.create(user.id, dto);
  }

  @Get('mes-commandes')
  @Roles('client')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.commandesCoursesExpressService.findAllForClient(user.id);
  }

  @Get('disponibles')
  @Roles('livreur')
  findDisponibles(@CurrentUser() user: AuthenticatedUser) {
    return this.commandesCoursesExpressService.findDisponiblesPourLivreur(
      user.id,
    );
  }

  @Get('mes-courses')
  @Roles('livreur')
  findMesCourses(@CurrentUser() user: AuthenticatedUser) {
    return this.commandesCoursesExpressService.findAllForLivreur(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commandesCoursesExpressService.findOneForUser(
      user.id,
      user.role,
      id,
    );
  }

  @Patch(':id/prendre-en-charge')
  @Roles('livreur')
  prendreEnCharge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.commandesCoursesExpressService.prendreEnCharge(user.id, id);
  }

  @Patch(':id/etapes/:etapeId/realiser')
  @Roles('livreur')
  realiserEtape(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('etapeId') etapeId: string,
  ) {
    return this.commandesCoursesExpressService.realiserEtape(
      user.id,
      id,
      etapeId,
    );
  }

  @Patch(':id/litige')
  @Roles('livreur')
  declarerLitige(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: DeclarerLitigeCoursesExpressDto,
  ) {
    return this.commandesCoursesExpressService.declarerLitige(user.id, id, dto);
  }

  @Patch(':id/annuler')
  @Roles('client')
  annuler(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commandesCoursesExpressService.annuler(user.id, id);
  }
}
