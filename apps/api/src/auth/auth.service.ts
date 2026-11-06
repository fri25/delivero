import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { tenantCourant } from '../tenancy/contexte-tenant';
import {
  appartenanceInitiale,
  avecRole,
  roleEffectif,
  TENANT_PAR_DEFAUT,
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
      include: avecRole(tenantCourant()),
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { telephone: dto.telephone },
      include: avecRole(tenantCourant()),
    });

    if (
      !user?.passwordHash ||
      !(await bcrypt.compare(dto.motDePasse, user.passwordHash))
    ) {
      throw new UnauthorizedException('Téléphone ou mot de passe incorrect.');
    }

    return this.buildAuthResponse(await this.devenirClientSiNouveau(user));
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: avecRole(tenantCourant()),
    });
    return this.toProfile(user);
  }

  /**
   * Decision Q-MT-2 (one account per phone number across companies): a
   * person who already has an account and signs in to another company
   * becomes one of its clients. Never another role: livreurs, restaurants
   * and admins are added by the company itself.
   */
  async devenirClientSiNouveau(
    user: UtilisateurAvecRole,
  ): Promise<UtilisateurAvecRole> {
    const tenantId = tenantCourant();
    if (user.memberships.length > 0 || tenantId === TENANT_PAR_DEFAUT) {
      return user;
    }
    const clientRole = await this.prisma.role.findUniqueOrThrow({
      where: { name: CLIENT_ROLE_NAME },
    });
    await this.prisma.membership.create({
      data: { userId: user.id, roleId: clientRole.id } as {
        userId: string;
        roleId: string;
        tenantId: string;
      },
    });
    return this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: avecRole(tenantId),
    });
  }

  // Also used by OtpService once a code is verified. Throws when the
  // membership in the company is suspended or missing.
  buildAuthResponse(user: UtilisateurAvecRole) {
    const profile = this.toProfile(user);
    const accessToken = this.jwtService.sign({
      sub: user.id,
      role: profile.role,
      tid: tenantCourant(),
    });
    return { accessToken, user: profile };
  }

  private toProfile(user: UtilisateurAvecRole) {
    const role = roleEffectif(user, tenantCourant());
    return {
      id: user.id,
      telephone: user.telephone,
      email: user.email ?? null,
      nom: user.nom,
      role: role.name,
      permissions: role.permissions.map((rp) => rp.permission.code),
    };
  }
}
