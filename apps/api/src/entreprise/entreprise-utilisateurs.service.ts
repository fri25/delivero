import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { TENANT_PAR_DEFAUT } from '../auth/appartenance';
import { ROLES, ROLES_BACK_OFFICE } from '../auth/roles';
import {
  normaliserTelephoneBenin,
  variantesTelephone,
} from '../auth/telephone';
import { PrismaService } from '../prisma/prisma.service';
import { tenantCourant } from '../tenancy/contexte-tenant';
import type { InviterUtilisateurDto } from './dto/inviter-utilisateur.dto';
import type { ModifierUtilisateurDto } from './dto/modifier-utilisateur.dto';

const SALT_ROUNDS = 10;
const ROLES_ADMIN: readonly string[] = [
  ROLES.adminEntreprise,
  ROLES.adminDispatcher,
];

const SELECTION = {
  id: true,
  statut: true,
  createdAt: true,
  role: { select: { name: true } },
  user: { select: { id: true, nom: true, telephone: true } },
} as const;

/**
 * Accounts of the company back-office (étape 8): memberships with a
 * back-office role. Livreurs and restaurants keep their own screens.
 * memberships is a company table: the Prisma extension and RLS scope every
 * query to the company of the request.
 */
@Injectable()
export class EntrepriseUtilisateursService {
  constructor(private readonly prisma: PrismaService) {}

  async lister() {
    const lignes = await this.prisma.membership.findMany({
      where: { role: { name: { in: [...ROLES_BACK_OFFICE] } } },
      select: SELECTION,
      orderBy: { createdAt: 'asc' },
    });
    return lignes.map(versVue);
  }

  /**
   * One account per phone number across companies (Q-MT-2): a person who
   * already has an account elsewhere joins with it, password unchanged.
   */
  async inviter(dto: InviterUtilisateurDto) {
    const telephone = normaliserTelephoneBenin(dto.telephone);
    if (!telephone) {
      throw new BadRequestException(
        'Numéro béninois invalide (ex. 01 57 86 69 59).',
      );
    }
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: dto.role },
    });
    const existant = await this.prisma.user.findFirst({
      where: { telephone: { in: variantesTelephone(telephone) } },
      include: {
        memberships: {
          where: { tenantId: tenantCourant() },
          include: { role: true },
        },
      },
    });

    if (existant) {
      const [appartenance] = existant.memberships;
      if (appartenance) {
        throw new ConflictException(
          `Ce numéro a déjà un compte dans l’entreprise (rôle ${appartenance.role.name}).`,
        );
      }
      const creee = await this.prisma.membership.create({
        data: { userId: existant.id, roleId: role.id } as {
          userId: string;
          roleId: string;
          tenantId: string;
        },
        select: SELECTION,
      });
      return versVue(creee);
    }

    if (!dto.motDePasse) {
      throw new BadRequestException(
        'Mot de passe requis pour un nouveau compte (8 caractères minimum).',
      );
    }
    const passwordHash = await bcrypt.hash(dto.motDePasse, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        telephone,
        nom: dto.nom,
        passwordHash,
        // Legacy column, only read for CHAP EXPRESS (removed at étape 10).
        roleId: role.id,
        memberships: {
          create: { roleId: role.id } as { roleId: string; tenantId: string },
        },
      },
    });
    return versVue(
      await this.prisma.membership.findFirstOrThrow({
        where: { userId: user.id },
        select: SELECTION,
      }),
    );
  }

  async modifier(id: string, dto: ModifierUtilisateurDto, acteurId: string) {
    const appartenance = await this.prisma.membership.findFirst({
      where: { id, role: { name: { in: [...ROLES_BACK_OFFICE] } } },
      include: { role: true },
    });
    if (!appartenance) {
      throw new NotFoundException('Compte du back-office introuvable.');
    }
    if (appartenance.userId === acteurId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier votre propre accès.',
      );
    }
    const perdAdmin =
      ROLES_ADMIN.includes(appartenance.role.name) &&
      ((dto.role !== undefined && !ROLES_ADMIN.includes(dto.role)) ||
        dto.statut === 'suspendu');
    if (perdAdmin && (await this.adminsActifs()) <= 1) {
      throw new ConflictException(
        'L’entreprise doit garder au moins un administrateur actif.',
      );
    }

    const role = dto.role
      ? await this.prisma.role.findUniqueOrThrow({ where: { name: dto.role } })
      : null;
    const modifiee = await this.prisma.membership.update({
      where: { id: appartenance.id },
      data: { statut: dto.statut, roleId: role?.id },
      select: SELECTION,
    });
    // Keeps the legacy fallback of CHAP EXPRESS consistent (étape 3).
    if (role && tenantCourant() === TENANT_PAR_DEFAUT) {
      await this.prisma.user.update({
        where: { id: appartenance.userId },
        data: { roleId: role.id },
      });
    }
    return versVue(modifiee);
  }

  private adminsActifs() {
    return this.prisma.membership.count({
      where: { statut: 'actif', role: { name: { in: [...ROLES_ADMIN] } } },
    });
  }
}

type Ligne = {
  id: string;
  statut: string;
  createdAt: Date;
  role: { name: string };
  user: { id: string; nom: string; telephone: string | null };
};

function versVue(ligne: Ligne) {
  return {
    id: ligne.id,
    userId: ligne.user.id,
    nom: ligne.user.nom,
    telephone: ligne.user.telephone,
    // admin_dispatcher is shown as what it is now (src/auth/roles.ts).
    role:
      ligne.role.name === ROLES.adminDispatcher
        ? ROLES.adminEntreprise
        : ligne.role.name,
    statut: ligne.statut,
    createdAt: ligne.createdAt,
  };
}
