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
import { AdminLivreursService } from './admin-livreurs.service';
import { CreateLivreurDto } from './dto/create-livreur.dto';
import { UpdateLivreurDto } from './dto/update-livreur.dto';

const ADMIN_ROLE_NAME = 'admin_dispatcher';

@Controller('admin/livreurs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ADMIN_ROLE_NAME)
export class AdminLivreursController {
  constructor(private readonly adminLivreursService: AdminLivreursService) {}

  @Get()
  findAll() {
    return this.adminLivreursService.findAll();
  }

  @Post()
  create(@Body() dto: CreateLivreurDto) {
    return this.adminLivreursService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLivreurDto) {
    return this.adminLivreursService.update(id, dto);
  }
}
