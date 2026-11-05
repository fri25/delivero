import { Prisma } from '@prisma/client';
import { contexteTenant } from '../tenancy/contexte-tenant';

/**
 * Business models: every row belongs to one company (tenant_id, étape 2).
 * Global models (User, Role, OtpCode, the platform tables) are not listed.
 */
export const MODELES_TENANT = new Set<string>([
  'Zone',
  'Quartier',
  'Partenaire',
  'Livreur',
  'Commande',
  'Adresse',
  'AbonnementPush',
  'Plat',
  'CommandeRepas',
  'LigneCommandeRepas',
  'CommandeColis',
  'CommandeEmplettes',
  'ArticleEmplette',
  'CommandeCoursesExpress',
  'EtapeCourseExpress',
  'Paiement',
  'Notation',
  'MouvementPortefeuille',
  'ClotureCaisse',
  'GrilleTarifaireColis',
  'GrilleTarifaireCoursesExpress',
  'Membership',
]);

// Operations whose `where` is a filter: the company is ANDed to it.
const FILTRES = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'updateManyAndReturn',
  'deleteMany',
]);
// Operations whose `where` is unique: the company is added next to the
// unique key (allowed since Prisma 5), so an id of another company reads as
// "not found" instead of returning its row.
const UNIQUES = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'update',
  'delete',
  'upsert',
]);
const CREATIONS = new Set(['create', 'createMany', 'createManyAndReturn']);

type Donnees = Record<string, unknown>;

/** Relation fields of each model, read from the generated client. */
const RELATIONS = new Map<string, Array<{ champ: string; modele: string }>>(
  Prisma.dmmf.datamodel.models.map((modele) => [
    modele.name,
    modele.fields
      .filter((champ) => champ.kind === 'object')
      .map((champ) => ({ champ: champ.name, modele: champ.type })),
  ]),
);

// Query arguments are typed per model and operation (600+ types): the
// extension handles them as plain objects. Typecheckers disagree on whether
// a direct assertion is needed, a function from unknown never is in doubt.
const enDonnees = (valeur: unknown): Donnees => valeur as Donnees;

const estObjet = (valeur: unknown): valeur is Donnees =>
  typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);

const enListe = (valeur: unknown): Donnees[] =>
  (Array.isArray(valeur) ? valeur : [valeur]).filter(estObjet);

/**
 * Sets the company on a row to create and on every row created in cascade
 * (nested create, createMany, connectOrCreate, upsert), at any depth. A row
 * that would escape gets no tenant_id and fails on NOT NULL instead.
 */
function injecter(modele: string, donnees: Donnees, tenantId: string): void {
  if (MODELES_TENANT.has(modele) && donnees.tenant === undefined) {
    donnees.tenantId = tenantId;
  }
  for (const { champ, modele: cible } of RELATIONS.get(modele) ?? []) {
    const ecriture = donnees[champ];
    if (!estObjet(ecriture)) continue;
    for (const ligne of enListe(ecriture.create)) {
      injecter(cible, ligne, tenantId);
    }
    if (estObjet(ecriture.createMany)) {
      for (const ligne of enListe(ecriture.createMany.data)) {
        injecter(cible, ligne, tenantId);
      }
    }
    for (const lien of enListe(ecriture.connectOrCreate)) {
      if (estObjet(lien.create)) injecter(cible, lien.create, tenantId);
    }
    for (const maj of enListe(ecriture.upsert)) {
      if (estObjet(maj.create)) injecter(cible, maj.create, tenantId);
      if (estObjet(maj.update)) injecter(cible, maj.update, tenantId);
    }
    for (const maj of enListe(ecriture.update)) {
      const donneesMaj = estObjet(maj.data) ? maj.data : maj;
      injecter(cible, donneesMaj, tenantId);
    }
  }
}

/**
 * Scopes every query of a business model to the company of the context
 * (étape 4). A query without context throws: forgetting the company is
 * loud, never a silent read of everybody's data.
 */
export const extensionTenant = Prisma.defineExtension({
  name: 'tenant',
  query: {
    $allModels: {
      $allOperations({ model, operation, args, query }) {
        const contexte = contexteTenant();
        if (contexte?.plateforme) {
          return query(args);
        }
        const tenantId = contexte?.tenantId;
        const scope = MODELES_TENANT.has(model);
        if (!tenantId) {
          if (scope) {
            throw new Error(
              `${model}.${operation} sans entreprise : appel hors requête, utiliser executerDansTenant().`,
            );
          }
          return query(args);
        }

        // Generic over 600 argument types: handled as plain objects.
        const a = enDonnees(args);
        if (scope && FILTRES.has(operation)) {
          a.where = a.where ? { AND: [a.where, { tenantId }] } : { tenantId };
        }
        if (scope && UNIQUES.has(operation)) {
          a.where = { ...(a.where as Donnees), tenantId };
        }
        // Writes, scoped model or not: a User created with nested
        // memberships or a Commande with nested lines get the company too.
        if (CREATIONS.has(operation)) {
          for (const ligne of enListe(a.data)) injecter(model, ligne, tenantId);
        }
        const creation = a.create;
        if (operation === 'upsert' && estObjet(creation)) {
          injecter(model, creation, tenantId);
        }
        if (
          ['update', 'updateMany', 'upsert'].includes(operation) &&
          estObjet(operation === 'upsert' ? a.update : a.data)
        ) {
          const maj = (operation === 'upsert' ? a.update : a.data) as Donnees;
          // Never move a row to another company through an update.
          delete maj.tenantId;
          delete maj.tenant;
          injecterImbriques(model, maj, tenantId);
        }
        return query(a);
      },
    },
  },
});

/** Nested creations inside an update, without touching the row itself. */
function injecterImbriques(modele: string, donnees: Donnees, tenantId: string) {
  const copie = { ...donnees };
  injecter(modele, copie, tenantId);
  for (const { champ } of RELATIONS.get(modele) ?? []) {
    if (champ in copie) donnees[champ] = copie[champ];
  }
}
