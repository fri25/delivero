import { PrismaClient } from '@prisma/client';

// Rôles du socle (voir docs/modele-donnees.md). Un seul rôle, admin_dispatcher,
// porte des permissions granulaires au lancement (Q-09, docs/acteurs.md) ; les
// autres rôles n'ont pas encore de permissions modélisées à ce stade.
// Shared by seed.ts (dev) and bootstrap-admin.ts (production).
export const ROLE_NAMES = [
  'client',
  'restaurant',
  'commerce',
  'livreur',
  'admin_dispatcher',
  'direction',
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

// Idempotent: upserts the roles, the admin permissions and their links.
export async function assurerSocle(prisma: PrismaClient): Promise<void> {
  for (const name of ROLE_NAMES) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const permission of ADMIN_DISPATCHER_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { description: permission.description },
      create: permission,
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'admin_dispatcher' },
  });
  for (const permission of ADMIN_DISPATCHER_PERMISSIONS) {
    const perm = await prisma.permission.findUniqueOrThrow({
      where: { code: permission.code },
    });
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }
}

// Étape 3 of docs/plan-migration-multi-tenant.md: every account is a member
// of CHAP EXPRESS (tnt_chapexpress, inserted by migration
// plateforme_tenants) with the role of users.role_id. Run after the accounts
// of seed.ts or bootstrap-admin.ts are created; leaves existing memberships
// untouched.
export async function assurerAppartenances(prisma: PrismaClient): Promise<void> {
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
