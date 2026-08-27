import {
  Body,
  Controller,
  Delete,
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
import { CommandesRepasService } from '../commandes-repas/commandes-repas.service';
import { CreatePlatDto } from './dto/create-plat.dto';
import { ToggleDisponibiliteDto } from './dto/toggle-disponibilite.dto';
import { ToggleOuvertureDto } from './dto/toggle-ouverture.dto';
import { UpdatePlatDto } from './dto/update-plat.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly commandesRepasService: CommandesRepasService,
  ) {}

  @Get()
  findAll(@Query('q') search?: string) {
    return this.restaurantsService.findAllPublic(search);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('restaurant')
  getOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.restaurantsService.getOwn(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('restaurant')
  updateOwn(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.updateOwn(user.id, dto);
  }

  @Patch('me/statut-ouverture')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('restaurant')
  toggleOuverture(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ToggleOuvertureDto,
  ) {
    return this.restaurantsService.toggleOuverture(
      user.id,
      dto.statutOuverture,
    );
  }

  @Get('me/commandes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('restaurant')
  async listOwnCommandes(@CurrentUser() user: AuthenticatedUser) {
    const partenaire = await this.restaurantsService.getOwn(user.id);
    return this.commandesRepasService.findAllForPartenaire(partenaire.id);
  }

  @Get('me/plats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('restaurant')
  listOwnPlats(@CurrentUser() user: AuthenticatedUser) {
    return this.restaurantsService.listOwnPlats(user.id);
  }

  @Post('me/plats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('restaurant')
  createPlat(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlatDto,
  ) {
    return this.restaurantsService.createPlat(user.id, dto);
  }

  @Patch('me/plats/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('restaurant')
  updatePlat(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePlatDto,
  ) {
    return this.restaurantsService.updatePlat(user.id, id, dto);
  }

  @Patch('me/plats/:id/disponibilite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('restaurant')
  togglePlatDisponibilite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ToggleDisponibiliteDto,
  ) {
    return this.restaurantsService.togglePlatDisponibilite(
      user.id,
      id,
      dto.disponible,
    );
  }

  @Delete('me/plats/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('restaurant')
  removePlat(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.restaurantsService.removePlat(user.id, id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOnePublic(id);
  }
}
