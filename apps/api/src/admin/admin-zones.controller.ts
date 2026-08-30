import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminZonesService } from './admin-zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

const ADMIN_ROLE_NAME = 'admin_dispatcher';

@Controller('admin/zones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ADMIN_ROLE_NAME)
export class AdminZonesController {
  constructor(private readonly adminZonesService: AdminZonesService) {}

  @Get()
  findAll() {
    return this.adminZonesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateZoneDto) {
    return this.adminZonesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.adminZonesService.update(id, dto);
  }
}
