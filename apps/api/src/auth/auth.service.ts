import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const CLIENT_ROLE_NAME = 'client';
const SALT_ROUNDS = 12;

type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { telephone: dto.telephone },
    });
    if (existing) {
      throw new ConflictException('Ce numéro de téléphone est déjà utilisé.');
    }

    const clientRole = await this.prisma.role.findUniqueOrThrow({
      where: { name: CLIENT_ROLE_NAME },
    });
    const passwordHash = await bcrypt.hash(dto.motDePasse, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        telephone: dto.telephone,
        nom: dto.nom,
        passwordHash,
        roleId: clientRole.id,
      },
      include: { role: true },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { telephone: dto.telephone },
      include: { role: true },
    });

    if (
      !user?.passwordHash ||
      !(await bcrypt.compare(dto.motDePasse, user.passwordHash))
    ) {
      throw new UnauthorizedException('Téléphone ou mot de passe incorrect.');
    }

    return this.buildAuthResponse(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { role: true },
    });
    return this.toProfile(user);
  }

  private buildAuthResponse(user: UserWithRole) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      role: user.role.name,
    });
    return { accessToken, user: this.toProfile(user) };
  }

  private toProfile(user: UserWithRole) {
    return {
      id: user.id,
      telephone: user.telephone,
      nom: user.nom,
      role: user.role.name,
    };
  }
}
