import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  appartenanceInitiale,
  AVEC_ROLE,
  roleEffectif,
  type UtilisateurAvecRole,
} from './appartenance';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const CLIENT_ROLE_NAME = 'client';
const SALT_ROUNDS = 12;

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

    const emailNormalise = dto.email?.trim().toLowerCase() || null;
    if (emailNormalise) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: emailNormalise },
      });
      if (existingEmail) {
        throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
      }
    }

    const clientRole = await this.prisma.role.findUniqueOrThrow({
      where: { name: CLIENT_ROLE_NAME },
    });
    const passwordHash = await bcrypt.hash(dto.motDePasse, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        telephone: dto.telephone,
        email: emailNormalise,
        nom: dto.nom,
        passwordHash,
        roleId: clientRole.id,
        memberships: appartenanceInitiale(clientRole.id),
      },
      include: AVEC_ROLE,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { telephone: dto.telephone },
      include: AVEC_ROLE,
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
      include: AVEC_ROLE,
    });
    return this.toProfile(user);
  }

  // Also used by OtpService once a code is verified. Throws when the
  // membership in the company is suspended.
  buildAuthResponse(user: UtilisateurAvecRole) {
    const profile = this.toProfile(user);
    const accessToken = this.jwtService.sign({
      sub: user.id,
      role: profile.role,
    });
    return { accessToken, user: profile };
  }

  private toProfile(user: UtilisateurAvecRole) {
    return {
      id: user.id,
      telephone: user.telephone,
      email: user.email ?? null,
      nom: user.nom,
      role: roleEffectif(user).name,
    };
  }
}
