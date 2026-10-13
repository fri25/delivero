import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminPartenairesService } from './admin-partenaires.service';
import { CreatePartenaireDto } from './dto/create-partenaire.dto';
import { SuspendrePartenaireDto } from './dto/suspendre-partenaire.dto';
import { UpdatePartenaireDto } from './dto/update-partenaire.dto';

const ADMIN_ROLE_NAME = 'admin_dispatcher';

@Controller('admin/partenaires')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ADMIN_ROLE_NAME)
@RequirePermissions('partenaires.gerer')
export class AdminPartenairesController {
  constructor(private readonly partenaires: AdminPartenairesService) {}

  @Get()
  findAll() {
    return this.partenaires.findAll();
  }

  @Post()
  create(@Body() dto: CreatePartenaireDto) {
    return this.partenaires.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePartenaireDto) {
    return this.partenaires.update(id, dto);
  }

  @Patch(':id/suspension')
  suspendre(@Param('id') id: string, @Body() dto: SuspendrePartenaireDto) {
    return this.partenaires.suspendre(id, dto.suspendu);
  }
}
