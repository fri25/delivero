import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { AdressesService } from './adresses.service';
import { CreateAdresseDto } from './dto/create-adresse.dto';
import { UpdateAdresseDto } from './dto/update-adresse.dto';

@Controller('adresses')
@UseGuards(JwtAuthGuard)
export class AdressesController {
  constructor(private readonly adressesService: AdressesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.adressesService.findAllForUser(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAdresseDto,
  ) {
    return this.adressesService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAdresseDto,
  ) {
    return this.adressesService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.adressesService.remove(user.id, id);
  }

  @Patch(':id/defaut')
  setDefault(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.adressesService.setDefault(user.id, id);
  }
}
