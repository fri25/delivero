import { PrismaClient } from '@prisma/client';

// Rôles du socle (voir docs/modele-donnees.md). Les rôles du back-office
// (admin_dispatcher, admin_entreprise, gestionnaire) portent des permissions
// granulaires (Q-09, docs/acteurs.md) ; les autres rôles n'en ont pas encore.
// Shared by seed.ts (dev) and bootstrap-admin.ts (production).
export const ROLE_NAMES = [
  'client',
  'restaurant',
  'commerce',
  'livreur',
  'admin_dispatcher',
  'direction',
  // Étape 8 of docs/plan-migration-multi-tenant.md (src/auth/roles.ts).
  'admin_entreprise',
  'gestionnaire',
] as const;

// Dérivées des lignes ✔ de la colonne "Admin/Dispatcher" de la matrice de
// permissions (docs/acteurs.md). Pas de valeur financière ni de comportement
// câblé ici : uniquement les codes d'action.
export const ADMIN_DISPATCHER_PERMISSIONS = [
  {
    code: 'commandes.consulter_toutes',
    description: 'Suivre toutes les commandes en temps réel, tous services',
  },
  {
    code: 'commandes.saisir_manuelle',
    description:
      'Saisir une demande reçue hors plateforme (téléphone, WhatsApp)',
  },
  {
    code: 'commandes.corriger_statut',
    description: 'Corriger manuellement le statut d’une course',
  },
  {
    code: 'commandes.valider_sensible',
    description: 'Valider une demande sensible',
  },
  {
    code: 'commandes.attribuer',
    description: 'Attribuer ou réattribuer une course',
  },
  {
    code: 'partenaires.gerer',
    description: 'Gérer les partenaires (création, commission, suspension)',
  },
  {
    code: 'partenaires.gerer_menu_pour_compte',
    description:
      'Saisir menu/catalogue pour le compte d’un partenaire peu équipé',
  },
  {
    code: 'livreurs.gerer',
    description: 'Gérer les livreurs (pièces, zones, plafonds)',
  },
  { code: 'zones.gerer', description: 'Gérer les zones et grilles tarifaires' },
  { code: 'promotions.gerer', description: 'Gérer les promotions' },
  {
    code: 'caisse.rapprocher',
    description:
      'Rapprochement et validation de la clôture de caisse, tous livreurs',
  },
  {
    code: 'portefeuilles.consulter_tous',
    description: 'Consulter et gérer le portefeuille de tous les livreurs',
  },
  {
    code: 'incidents.traiter',
    description: 'Traiter les incidents et litiges',
  },
  {
    code: 'statistiques.consulter_tout',
    description:
      'Consulter les tableaux de bord et statistiques, tous services',
  },
  { code: 'donnees.exporter', description: 'Exporter des données (Excel/CSV)' },
] as const;

// Étape 8: what the company back-office adds. Refunds were under
// incidents.traiter with cancellations; they get their own code so that a
// gestionnaire can cancel without refunding.
export const PERMISSIONS_ENTREPRISE = [
  {
    code: 'paiements.rembourser',
    description: 'Traiter les remboursements Mobile Money',
  },
  {
    code: 'entreprise.parametres',
    description: 'Modifier les réglages de l’entreprise (identité, FedaPay)',
  },
  {
    code: 'entreprise.utilisateurs',
    description: 'Gérer les comptes du back-office et leurs rôles',
  },
  { code: 'journal.consulter', description: 'Consulter le journal d’activité' },
  { code: 'clients.consulter', description: 'Consulter la liste des clients' },
] as const;

type CodePermission =
  | (typeof ADMIN_DISPATCHER_PERMISSIONS)[number]['code']
  | (typeof PERMISSIONS_ENTREPRISE)[number]['code'];

const TOUT: CodePermission[] = [
  ...ADMIN_DISPATCHER_PERMISSIONS,
  ...PERMISSIONS_ENTREPRISE,
].map((p) => p.code);

// Day-to-day operations: no zones, quartiers, restaurants, promotions,
// refunds, settings, users or journal (plan, étape 8).
const GESTIONNAIRE: CodePermission[] = [
  'commandes.consulter_toutes',
  'commandes.saisir_manuelle',
  'commandes.corriger_statut',
  'commandes.valider_sensible',
  'commandes.attribuer',
  'livreurs.gerer',
  'caisse.rapprocher',
  'portefeuilles.consulter_tous',
  'incidents.traiter',
  'statistiques.consulter_tout',
  'donnees.exporter',
  'clients.consulter',
];

/** Same lists as migration 20261106140000_roles_entreprise. */
export const PERMISSIONS_PAR_ROLE: Record<string, CodePermission[]> = {
  admin_dispatcher: TOUT,
  admin_entreprise: TOUT,
  gestionnaire: GESTIONNAIRE,
};

// Idempotent: upserts the roles, the permissions and their links.
export async function assurerSocle(prisma: PrismaClient): Promise<void> {
  for (const name of ROLE_NAMES) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const permission of [
    ...ADMIN_DISPATCHER_PERMISSIONS,
    ...PERMISSIONS_ENTREPRISE,
  ]) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { description: permission.description },
      create: permission,
    });
  }

  for (const [roleName, codes] of Object.entries(PERMISSIONS_PAR_ROLE)) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: roleName },
    });
    for (const code of codes) {
      const perm = await prisma.permission.findUniqueOrThrow({
        where: { code },
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }
}

// Étape 3 of docs/plan-migration-multi-tenant.md: every account is a member
// of CHAP EXPRESS (tnt_chapexpress, inserted by migration
// plateforme_tenants) with the role of users.role_id. Run after the accounts
// of seed.ts or bootstrap-admin.ts are created; leaves existing memberships
// untouched.
export async function assurerAppartenances(
  prisma: PrismaClient,
): Promise<void> {
  const sansAppartenance = await prisma.user.findMany({
    where: { memberships: { none: { tenantId: 'tnt_chapexpress' } } },
    select: { id: true, roleId: true },
  });
  await prisma.membership.createMany({
    data: sansAppartenance.map((user) => ({
      userId: user.id,
      tenantId: 'tnt_chapexpress',
      roleId: user.roleId,
    })),
    skipDuplicates: true,
  });
}
