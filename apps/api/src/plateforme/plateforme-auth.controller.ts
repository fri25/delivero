import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import * as bcrypt from 'bcryptjs';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import {
  variantesTelephone,
  normaliserTelephoneBenin,
} from '../auth/telephone';
import { PrismaService } from '../prisma/prisma.service';
import { ConnexionPlateformeDto } from './dto/connexion-plateforme.dto';
import { PlateformeAuthGuard } from './plateforme-auth.guard';

// @Public(): out of the global company guard; `moi` has its own guard.
@Controller('plateforme/auth')
@Public()
export class PlateformeAuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Same limit as the company sign-in (V03). */
  @Post('connexion')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async connexion(@Body() dto: ConnexionPlateformeDto) {
    const normalise = normaliserTelephoneBenin(dto.telephone);
    const user = await this.prisma.user.findFirst({
      where: {
        telephone: {
          in: normalise ? variantesTelephone(normalise) : [dto.telephone],
        },
        platformAdmin: { isNot: null },
      },
    });
    if (
      !user?.passwordHash ||
      !(await bcrypt.compare(dto.motDePasse, user.passwordHash))
    ) {
      throw new UnauthorizedException('Téléphone ou mot de passe incorrect.');
    }
    return {
      accessToken: this.jwt.sign({
        sub: user.id,
        role: 'plateforme',
        scope: 'plateforme',
      }),
      user: { id: user.id, nom: user.nom, telephone: user.telephone },
    };
  }

  @Get('moi')
  @UseGuards(PlateformeAuthGuard)
  async moi(@Req() requete: Request) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: requete.plateformeAdminId },
      select: { id: true, nom: true, telephone: true },
    });
    return user;
  }
}
