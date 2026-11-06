import { resolveTxt } from 'node:dns/promises';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ROLES } from '../auth/roles';
import {
  normaliserTelephoneBenin,
  variantesTelephone,
} from '../auth/telephone';
import { PrismaService } from '../prisma/prisma.service';
import { ParametresTenantService } from '../tenancy/parametres-tenant.service';
import { ResolutionTenantService } from '../tenancy/resolution-tenant.service';
import type { AbonnementDto } from './dto/abonnement.dto';
import type { CreerEntrepriseDto } from './dto/creer-entreprise.dto';
import type { DomaineDto } from './dto/domaine.dto';
import type { FonctionnalitesDto } from './dto/fonctionnalites.dto';
import type { ModifierEntrepriseDto } from './dto/modifier-entreprise.dto';
import { FONCTIONNALITES, SLUGS_RESERVES } from './plateforme.constantes';

const SALT_ROUNDS = 12;
const JOURS_RECENTS = 30;

// Base theme of the apps (packages/config/marque.css): a new company starts
// from it and changes it in its own Settings screen (étape 8).
const THEME_DE_BASE = {
  couleurPrimaire: '#1450d8',
  couleurMarine: '#0a2a66',
  couleurSignal: '#d7262e',
};

// Benin only for now: phone checks and prices are Benin-specific.
const LOCALE_BENIN = {
  pays: 'BJ',
  devise: 'XOF',
  fuseauHoraire: 'Africa/Porto-Novo',
  indicatifTelephone: '+229',
};

/** TXT record that proves a company controls a custom domain. */
export const enregistrementVerification = (domaine: string, id: string) => ({
  nom: `_rapidliv.${domaine}`,
  valeur: `rapidliv-verification=${id}`,
});

/**
 * Companies seen from the platform (étape 9 of
 * docs/plan-migration-multi-tenant.md). Every request runs in platform
 * context (TenantMiddleware): no company filter, each query names its
 * company explicitly.
 */
@Injectable()
export class PlateformeEntreprisesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parametres: ParametresTenantService,
    private readonly resolution: ResolutionTenantService,
  ) {}

  async lister() {
    const [entreprises, stats] = await Promise.all([
      this.prisma.tenant.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          parametres: { select: { nomCommercial: true, ville: true } },
          domaines: { orderBy: { createdAt: 'asc' } },
          abonnement: { include: { plan: true } },
        },
      }),
      this.statistiques(),
    ]);
    return entreprises.map((e) => ({
      id: e.id,
      slug: e.slug,
      nom: e.nom,
      statut: e.statut,
      createdAt: e.createdAt,
      nomCommercial: e.parametres?.nomCommercial ?? null,
      ville: e.parametres?.ville ?? null,
      domaines: e.domaines.map((d) => ({
        domaine: d.domaine,
        principal: d.principal,
        verifie: d.verifieAt !== null,
      })),
      abonnement: e.abonnement
        ? { plan: e.abonnement.plan.nom, statut: e.abonnement.statut }
        : null,
      statistiques: stats.get(e.id) ?? statistiquesVides(),
    }));
  }

  async detail(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        parametres: true,
        domaines: { orderBy: { createdAt: 'asc' } },
        fonctionnalites: true,
        abonnement: { include: { plan: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Entreprise introuvable.');
    const ouvertes = new Set(
      tenant.fonctionnalites.filter((f) => f.actif).map((f) => f.code),
    );
    const admins = await this.prisma.membership.findMany({
      where: {
        tenantId: id,
        role: { name: { in: [ROLES.adminEntreprise, ROLES.adminDispatcher] } },
      },
      select: {
        statut: true,
        user: { select: { nom: true, telephone: true } },
      },
    });
    return {
      id: tenant.id,
      slug: tenant.slug,
      nom: tenant.nom,
      statut: tenant.statut,
      createdAt: tenant.createdAt,
      parametres: tenant.parametres
        ? {
            nomCommercial: tenant.parametres.nomCommercial,
            ville: tenant.parametres.ville,
            tauxCommission: Number(tenant.parametres.tauxCommission),
            telephoneContact: tenant.parametres.telephoneContact,
            emailContact: tenant.parametres.emailContact,
          }
        : null,
      domaines: tenant.domaines.map((d) => ({
        id: d.id,
        domaine: d.domaine,
        principal: d.principal,
        verifieAt: d.verifieAt,
        verification: enregistrementVerification(d.domaine, tenant.id),
      })),
      fonctionnalites: FONCTIONNALITES.map((code) => ({
        code,
        ouverte: ouvertes.has(code),
      })),
      abonnement: tenant.abonnement
        ? {
            planCode: tenant.abonnement.plan.code,
            plan: tenant.abonnement.plan.nom,
            statut: tenant.abonnement.statut,
            debutAt: tenant.abonnement.debutAt,
            finAt: tenant.abonnement.finAt,
          }
        : null,
      administrateurs: admins.map((a) => ({
        nom: a.user.nom,
        telephone: a.user.telephone,
        statut: a.statut,
      })),
      statistiques:
        (await this.statistiques(id)).get(id) ?? statistiquesVides(),
    };
  }

  /** The company, its settings, features, subscription and first admin. */
  async creer(dto: CreerEntrepriseDto) {
    if (SLUGS_RESERVES.includes(dto.slug)) {
      throw new BadRequestException('Cet identifiant est réservé.');
    }
    if (await this.prisma.tenant.findUnique({ where: { slug: dto.slug } })) {
      throw new ConflictException('Cet identifiant est déjà pris.');
    }
    const plan = await this.prisma.plan.findUnique({
      where: { code: dto.planCode },
    });
    if (!plan) throw new BadRequestException('Offre inconnue.');
    const telephone = normaliserTelephoneBenin(dto.admin.telephone);
    if (!telephone) {
      throw new BadRequestException(
        'Numéro béninois invalide pour l’administrateur (ex. 01 57 86 69 59).',
      );
    }
    const existant = await this.prisma.user.findFirst({
      where: { telephone: { in: variantesTelephone(telephone) } },
    });
    if (!existant && !dto.admin.motDePasse) {
      throw new BadRequestException(
        'Mot de passe requis pour un nouveau compte administrateur.',
      );
    }
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: ROLES.adminEntreprise },
    });
    const passwordHash = dto.admin.motDePasse
      ? await bcrypt.hash(dto.admin.motDePasse, SALT_ROUNDS)
      : null;

    const tenant = await this.prisma.$transaction(async (tx) => {
      const cree = await tx.tenant.create({
        data: { slug: dto.slug, nom: dto.nom },
      });
      await tx.tenantSettings.create({
        data: {
          tenantId: cree.id,
          nomCommercial: dto.nomCommercial ?? dto.nom,
          ...THEME_DE_BASE,
          ...(dto.couleurPrimaire
            ? { couleurPrimaire: dto.couleurPrimaire }
            : {}),
          ville: dto.ville,
          ...LOCALE_BENIN,
          tauxCommission: new Prisma.Decimal(dto.tauxCommission),
        },
      });
      await tx.tenantFeature.createMany({
        data: FONCTIONNALITES.map((code) => ({
          tenantId: cree.id,
          code,
          actif: dto.fonctionnalites.includes(code),
        })),
      });
      await tx.subscription.create({
        data: {
          tenantId: cree.id,
          planId: plan.id,
          statut: dto.statutAbonnement,
        },
      });
      const userId =
        existant?.id ??
        (
          await tx.user.create({
            data: {
              telephone,
              nom: dto.admin.nom,
              passwordHash,
              // Legacy column, only read for CHAP EXPRESS (étape 10).
              roleId: role.id,
            },
          })
        ).id;
      await tx.membership.create({
        data: { userId, tenantId: cree.id, roleId: role.id },
      });
      return cree;
    });
    return this.detail(tenant.id);
  }

  async modifier(id: string, dto: ModifierEntrepriseDto) {
    await this.existe(id);
    await this.prisma.tenant.update({ where: { id }, data: dto });
    this.oublier(id);
    return this.detail(id);
  }

  async fonctionnalites(id: string, dto: FonctionnalitesDto) {
    await this.existe(id);
    await this.prisma.$transaction(
      FONCTIONNALITES.map((code) =>
        this.prisma.tenantFeature.upsert({
          where: { tenantId_code: { tenantId: id, code } },
          create: { tenantId: id, code, actif: dto.ouvertes.includes(code) },
          update: { actif: dto.ouvertes.includes(code) },
        }),
      ),
    );
    this.oublier(id);
    return this.detail(id);
  }

  async abonnement(id: string, dto: AbonnementDto) {
    await this.existe(id);
    const plan = await this.prisma.plan.findUnique({
      where: { code: dto.planCode },
    });
    if (!plan) throw new BadRequestException('Offre inconnue.');
    const finAt =
      dto.finAt === undefined ? undefined : dto.finAt && new Date(dto.finAt);
    await this.prisma.subscription.upsert({
      where: { tenantId: id },
      create: { tenantId: id, planId: plan.id, statut: dto.statut, finAt },
      update: { planId: plan.id, statut: dto.statut, finAt },
    });
    return this.detail(id);
  }

  async ajouterDomaine(id: string, dto: DomaineDto) {
    await this.existe(id);
    if (
      await this.prisma.tenantDomain.findUnique({
        where: { domaine: dto.domaine },
      })
    ) {
      throw new ConflictException('Ce domaine est déjà rattaché.');
    }
    await this.prisma.$transaction(async (tx) => {
      if (dto.principal) {
        await tx.tenantDomain.updateMany({
          where: { tenantId: id },
          data: { principal: false },
        });
      }
      await tx.tenantDomain.create({
        data: {
          tenantId: id,
          domaine: dto.domaine,
          principal: dto.principal ?? false,
        },
      });
    });
    this.oublier(id);
    return this.detail(id);
  }

  async retirerDomaine(id: string, domaineId: string) {
    const domaine = await this.domaine(id, domaineId);
    await this.prisma.tenantDomain.delete({ where: { id: domaine.id } });
    this.oublier(id);
    return this.detail(id);
  }

  /**
   * Checks the TXT record `_rapidliv.<domaine>` = `rapidliv-verification=<id>`.
   * Until then, the domain resolves the company but is not used in the
   * links it sends (ParametresTenantService.domainePrincipal).
   */
  async verifierDomaine(id: string, domaineId: string) {
    const domaine = await this.domaine(id, domaineId);
    const attendu = enregistrementVerification(domaine.domaine, id);
    let valeurs: string[] = [];
    try {
      valeurs = (await resolveTxt(attendu.nom)).map((morceaux) =>
        morceaux.join(''),
      );
    } catch {
      valeurs = [];
    }
    if (!valeurs.includes(attendu.valeur)) {
      throw new ConflictException(
        `Enregistrement TXT introuvable : ajoutez ${attendu.nom} = "${attendu.valeur}" dans la zone DNS, puis réessayez (la propagation peut prendre une heure).`,
      );
    }
    await this.prisma.tenantDomain.update({
      where: { id: domaine.id },
      data: { verifieAt: new Date() },
    });
    this.oublier(id);
    return this.detail(id);
  }

  offres() {
    return this.prisma.plan.findMany({
      orderBy: { createdAt: 'asc' },
      select: { code: true, nom: true, description: true },
    });
  }

  private async existe(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Entreprise introuvable.');
    return tenant;
  }

  private async domaine(tenantId: string, domaineId: string) {
    const domaine = await this.prisma.tenantDomain.findFirst({
      where: { id: domaineId, tenantId },
    });
    if (!domaine) throw new NotFoundException('Domaine introuvable.');
    return domaine;
  }

  private oublier(id: string) {
    this.parametres.oublier(id);
    this.resolution.oublier();
  }

  /** Activity per company: orders, amount ordered, couriers, clients. */
  private async statistiques(tenantId?: string) {
    const filtre = tenantId ? { tenantId } : {};
    const depuis = new Date(Date.now() - JOURS_RECENTS * 24 * 3600 * 1000);
    const [commandes, recentes, livreurs, disponibles, clients, partenaires] =
      await Promise.all([
        this.prisma.commande.groupBy({
          by: ['tenantId'],
          where: filtre,
          _count: { _all: true },
        }),
        this.prisma.commande.groupBy({
          by: ['tenantId'],
          where: { ...filtre, createdAt: { gte: depuis } },
          _count: { _all: true },
          _sum: { montantTotal: true },
        }),
        this.prisma.livreur.groupBy({
          by: ['tenantId'],
          where: filtre,
          _count: { _all: true },
        }),
        this.prisma.livreur.groupBy({
          by: ['tenantId'],
          where: { ...filtre, disponible: true },
          _count: { _all: true },
        }),
        this.prisma.membership.groupBy({
          by: ['tenantId'],
          where: { ...filtre, role: { name: ROLES.client } },
          _count: { _all: true },
        }),
        this.prisma.partenaire.groupBy({
          by: ['tenantId'],
          where: filtre,
          _count: { _all: true },
        }),
      ]);
    const parEntreprise = new Map<
      string,
      ReturnType<typeof statistiquesVides>
    >();
    const ligne = (id: string) => {
      const existante = parEntreprise.get(id) ?? statistiquesVides();
      parEntreprise.set(id, existante);
      return existante;
    };
    for (const c of commandes) ligne(c.tenantId).commandes = c._count._all;
    for (const c of recentes) {
      ligne(c.tenantId).commandes30j = c._count._all;
      ligne(c.tenantId).montant30j = Number(c._sum.montantTotal ?? 0);
    }
    for (const l of livreurs) ligne(l.tenantId).livreurs = l._count._all;
    for (const l of disponibles)
      ligne(l.tenantId).livreursDisponibles = l._count._all;
    for (const c of clients) ligne(c.tenantId).clients = c._count._all;
    for (const p of partenaires) ligne(p.tenantId).partenaires = p._count._all;
    return parEntreprise;
  }
}

function statistiquesVides() {
  return {
    commandes: 0,
    commandes30j: 0,
    /** Sum of montant_total of the orders placed in 30 days, all statuses. */
    montant30j: 0,
    livreurs: 0,
    livreursDisponibles: 0,
    clients: 0,
    partenaires: 0,
  };
}
