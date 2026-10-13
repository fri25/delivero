import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateQuartierDto } from './dto/create-quartier.dto';
import { UpdateQuartierDto } from './dto/update-quartier.dto';
import { QuartiersService } from './quartiers.service';

/** Public: guests pick their neighbourhood too (F-CLI-02). */
@Controller('quartiers')
export class QuartiersController {
  constructor(private readonly quartiers: QuartiersService) {}

  @Public()
  @Get()
  lister() {
    return this.quartiers.listerActifs();
  }
}

/** Back-office: neighbourhoods and their price (same right as zones). */
@Controller('admin/quartiers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin_dispatcher')
@RequirePermissions('zones.gerer')
export class AdminQuartiersController {
  constructor(private readonly quartiers: QuartiersService) {}

  @Get()
  lister() {
    return this.quartiers.listerTous();
  }

  @Post()
  creer(@Body() dto: CreateQuartierDto) {
    return this.quartiers.creer(dto);
  }

  @Patch(':id')
  modifier(@Param('id') id: string, @Body() dto: UpdateQuartierDto) {
    return this.quartiers.modifier(id, dto);
  }
}
