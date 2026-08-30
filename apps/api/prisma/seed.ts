import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, TypePartenaire } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

// Compte de démonstration pour tester le parcours Repas de bout en bout en
// local (voir docs/service-repas.md). Mot de passe volontairement simple :
// données de développement uniquement, jamais utilisées en production.
const DEMO_RESTAURANT = {
  telephone: '+22900000001',
  motDePasse: 'demo12345',
  nom: 'Le Baobab',
  description: 'Cuisine locale et grillades, au cœur de Natitingou.',
  horaires: 'Tous les jours, 11h–22h',
  plats: [
    { nom: 'Poulet braisé + attiéké', categorie: 'Plats', prix: 2500 },
    { nom: 'Riz gras', categorie: 'Plats', prix: 1500 },
    { nom: 'Jus de bissap', categorie: 'Boissons', prix: 500 },
  ],
} as const;

const DEMO_CLIENT = {
  telephone: '+22900000002',
  motDePasse: 'demo12345',
  nom: 'Client Démo',
} as const;

const DEMO_ADMIN = {
  telephone: '+22900000004',
  motDePasse: 'demo12345',
  nom: 'Admin Démo',
} as const;

// Plafonds d'avance/de caisse : valeurs de développement arbitraires, la
// question du montant réel n'est pas tranchée (Q-02, voir
// docs/decisions-ouvertes.md) — ne jamais réutiliser ces chiffres comme une
// recommandation métier.
const DEMO_LIVREUR = {
  telephone: '+22900000003',
  motDePasse: 'demo12345',
  nom: 'Livreur Démo',
  plafondAvance: 20000,
  plafondCaisse: 50000,
} as const;

// Catalogue de lancement du service Repas, phase pilote (voir
// docs/annexe-a-catalogue-lancement.md, restaurants REST-01 à REST-07).
// Coordonnées GPS, mode de réception et contact responsable ne sont pas
// seedés : ces champs n'existent pas encore sur le modèle Partenaire (voir
// docs/modele-donnees.md, marqué [DÉDUIT]). Adresse, point de repère,
// horaires et description restent les valeurs [FICTIF] de l'annexe,
// suffisantes pour un jeu de données de développement. Le taux de commission
// (15 %) est seedé pour rester aligné avec RG-08, mais n'est lu par aucun
// service à ce jour : Repas facture 15 % en dur (RG-08, décidé le
// 2026-08-25, taux unique non négocié par restaurant) et les 3 autres
// services n'ont pas encore de modèle de commission par partenaire. Ce n'est
// pas un bug — ne pas re-signaler comme incohérence sans relire RG-08.
interface PilotPlat {
  nom: string;
  categorie: string;
  prix: number;
  description?: string;
}

interface PilotRestaurant {
  telephone: string;
  motDePasse: string;
  nom: string;
  description: string;
  adresse: string;
  pointDeRepere: string;
  horaires: string;
  plats: PilotPlat[];
}

const PILOT_RESTAURANTS: PilotRestaurant[] = [
  {
    telephone: '+22900000011',
    motDePasse: 'demo12345',
    nom: 'Chez Guillaume',
    description: 'Pâtisserie',
    adresse: 'Quartier Yimporima, près du carrefour du marché central, Natitingou',
    pointDeRepere: 'En face de la station-service, immeuble à façade jaune',
    horaires: 'Lundi–samedi 6h30–19h00 ; dimanche 7h00–13h00',
    plats: [
      { nom: 'Croissant', categorie: 'Viennoiseries & pâtisseries', prix: 300 },
      { nom: 'Pain au chocolat', categorie: 'Viennoiseries & pâtisseries', prix: 350 },
      { nom: 'Gâteau à la part', categorie: 'Viennoiseries & pâtisseries', prix: 500 },
      { nom: 'Beignets sucrés (x5)', categorie: 'Viennoiseries & pâtisseries', prix: 250 },
      { nom: 'Cake maison', categorie: 'Viennoiseries & pâtisseries', prix: 600 },
      {
        nom: "Gâteau d'anniversaire sur commande",
        categorie: 'Viennoiseries & pâtisseries',
        prix: 8000,
        description: "Sur commande, 24 h à l'avance minimum.",
      },
      { nom: 'Jus locaux (bissap / gingembre)', categorie: 'Boissons', prix: 500 },
    ],
  },
  {
    telephone: '+22900000012',
    motDePasse: 'demo12345',
    nom: 'Okoti Saveurs',
    description: 'Viande de brousse',
    adresse: 'Route de Kouandé, quartier Peporiyakou, Natitingou',
    pointDeRepere: 'À 200 m après le pont, côté droit en venant du centre',
    horaires: 'Tous les jours 11h00–22h30',
    plats: [
      { nom: 'Agouti braisé', categorie: 'Grillades', prix: 3500 },
      { nom: 'Biche sauce arachide', categorie: 'Grillades', prix: 4000 },
      { nom: 'Pintade braisée', categorie: 'Grillades', prix: 3000 },
      { nom: 'Lapin sauce tomate', categorie: 'Grillades', prix: 2500 },
      { nom: 'Riz (accompagnement)', categorie: 'Accompagnements', prix: 500 },
      { nom: 'Igname pilée (accompagnement)', categorie: 'Accompagnements', prix: 500 },
      { nom: 'Pâte rouge (accompagnement)', categorie: 'Accompagnements', prix: 500 },
      { nom: 'Frites (accompagnement)', categorie: 'Accompagnements', prix: 500 },
      { nom: 'Supplément piment', categorie: 'Suppléments', prix: 200 },
      { nom: 'Supplément akpan', categorie: 'Suppléments', prix: 200 },
    ],
  },
  {
    telephone: '+22900000013',
    motDePasse: 'demo12345',
    nom: 'John Café',
    description: 'Cafés et thés infusés au moringa, sandwichs, petits-déjeuners',
    adresse: "Avenue de l'Indépendance, centre-ville de Natitingou",
    pointDeRepere: 'À côté de la pharmacie, terrasse bleue',
    horaires: 'Lundi–samedi 6h00–20h00 ; dimanche fermé',
    plats: [
      { nom: 'Café moringa', categorie: 'Boissons chaudes', prix: 700 },
      { nom: 'Thé moringa-citron', categorie: 'Boissons chaudes', prix: 600 },
      { nom: 'Café au lait', categorie: 'Boissons chaudes', prix: 800 },
      { nom: 'Chocolat chaud', categorie: 'Boissons chaudes', prix: 900 },
      {
        nom: 'Formule petit-déjeuner complet',
        categorie: 'Formule petit-déjeuner',
        prix: 1800,
        description: 'Boisson + omelette + pain.',
      },
      { nom: 'Sandwich thon', categorie: 'Sandwichs', prix: 1200 },
      { nom: 'Sandwich poulet', categorie: 'Sandwichs', prix: 1500 },
      { nom: 'Croque-monsieur', categorie: 'Sandwichs', prix: 1300 },
      { nom: 'Smoothie moringa-ananas', categorie: 'Boissons fraîches', prix: 1200 },
    ],
  },
  {
    telephone: '+22900000014',
    motDePasse: 'demo12345',
    nom: 'Le Bélier',
    description: "Igname pilée (sauce arachide et fromage peul), tête de mouton façon Bélier ; également pizzas et chawarmas",
    adresse: 'Quartier Tchirimina, Natitingou',
    pointDeRepere: 'Près du stade municipal, enseigne rouge',
    horaires: 'Tous les jours 10h00–23h00',
    plats: [
      { nom: 'Igname pilée sauce arachide + fromage peul', categorie: 'Cuisine locale', prix: 2500 },
      {
        nom: 'Tête de mouton façon Bélier',
        categorie: 'Cuisine locale',
        prix: 4500,
        description: 'Sur commande, délai de préparation environ 45 min.',
      },
      { nom: 'Pâte noire sauce légume', categorie: 'Cuisine locale', prix: 1500 },
      { nom: 'Pizza margherita', categorie: 'Pizzas', prix: 3500 },
      { nom: 'Pizza poulet', categorie: 'Pizzas', prix: 4500 },
      { nom: 'Pizza complète', categorie: 'Pizzas', prix: 5500 },
      { nom: 'Chawarma poulet', categorie: 'Chawarmas', prix: 1800 },
      { nom: 'Chawarma viande', categorie: 'Chawarmas', prix: 2000 },
      { nom: 'Frites', categorie: 'Accompagnements & boissons', prix: 700 },
      {
        nom: 'Boissons',
        categorie: 'Accompagnements & boissons',
        prix: 500,
        description: 'Gamme 500 à 1 000 F selon la référence.',
      },
    ],
  },
  {
    telephone: '+22900000015',
    motDePasse: 'demo12345',
    nom: 'Mini Kota',
    description: 'Maquis-grill — poulet braisé, poisson braisé, brochettes',
    adresse: 'Quartier Santa, Natitingou',
    pointDeRepere: 'Carrefour Santa, sous les manguiers',
    horaires: 'Mardi–dimanche 17h00–00h00 ; lundi fermé',
    plats: [
      { nom: 'Demi-poulet braisé', categorie: 'Grillades', prix: 2800 },
      { nom: 'Poulet entier braisé', categorie: 'Grillades', prix: 5000 },
      { nom: 'Poisson tilapia braisé', categorie: 'Grillades', prix: 2500 },
      { nom: 'Brochettes de bœuf (x3)', categorie: 'Grillades', prix: 1500 },
      { nom: 'Attiéké', categorie: 'Accompagnements', prix: 500 },
      { nom: 'Alloco', categorie: 'Accompagnements', prix: 700 },
      { nom: 'Frites', categorie: 'Accompagnements', prix: 700 },
      { nom: 'Salade fraîche', categorie: 'Accompagnements', prix: 500 },
      {
        nom: 'Boissons',
        categorie: 'Boissons',
        prix: 500,
        description: 'Gamme 500 à 1 000 F selon la référence.',
      },
    ],
  },
  {
    telephone: '+22900000016',
    motDePasse: 'demo12345',
    nom: "Jardin de l'Atacora",
    description: 'Restaurant de jardin — cuisine africaine et plats internationaux, cadre verdoyant',
    adresse: 'Route de la Chute de Kota, sortie sud de Natitingou',
    pointDeRepere: "Grand portail vert, 500 m après l'hôtel",
    horaires: 'Tous les jours 11h00–23h00',
    plats: [
      { nom: 'Poulet DG', categorie: 'Plats principaux', prix: 3500 },
      { nom: 'Riz sauté aux crevettes', categorie: 'Plats principaux', prix: 3000 },
      { nom: 'Spaghetti bolognaise', categorie: 'Plats principaux', prix: 2200 },
      { nom: 'Steak-frites', categorie: 'Plats principaux', prix: 3800 },
      { nom: 'Poisson braisé complet', categorie: 'Plats principaux', prix: 3200 },
      { nom: 'Igname frite + viande', categorie: 'Plats principaux', prix: 2000 },
      {
        nom: 'Plat du jour',
        categorie: 'Plats principaux',
        prix: 2000,
        description: 'Composition variable selon le jour.',
      },
      { nom: 'Salade composée', categorie: 'Accompagnements & boissons', prix: 1500 },
      { nom: 'Jus naturels', categorie: 'Accompagnements & boissons', prix: 800 },
    ],
  },
  {
    telephone: '+22900000017',
    motDePasse: 'demo12345',
    nom: "Les Délices d'Angèle",
    description: 'Riz, spaghetti, chawarma, panini',
    adresse: 'Quartier Ourbouga, Natitingou',
    pointDeRepere: 'À 100 m du collège, kiosque bleu et blanc',
    horaires: 'Lundi–samedi 10h00–21h00 ; dimanche 12h00–20h00',
    plats: [
      { nom: 'Riz sauce tomate + viande', categorie: 'Riz & pâtes', prix: 1500 },
      { nom: 'Riz gras', categorie: 'Riz & pâtes', prix: 1800 },
      { nom: 'Spaghetti sauce viande', categorie: 'Riz & pâtes', prix: 1500 },
      { nom: 'Spaghetti aux œufs', categorie: 'Riz & pâtes', prix: 1200 },
      { nom: 'Chawarma poulet', categorie: 'Sandwichs & chawarma', prix: 1800 },
      { nom: 'Chawarma viande', categorie: 'Sandwichs & chawarma', prix: 2000 },
      { nom: 'Panini poulet', categorie: 'Sandwichs & chawarma', prix: 1500 },
      { nom: 'Panini fromage', categorie: 'Sandwichs & chawarma', prix: 1200 },
      { nom: 'Frites', categorie: 'Accompagnements & boissons', prix: 700 },
      { nom: 'Boissons', categorie: 'Accompagnements & boissons', prix: 500 },
    ],
  },
];

// Rôles du socle (voir docs/modele-donnees.md). Un seul rôle, admin_dispatcher,
// porte des permissions granulaires au lancement (Q-09, docs/acteurs.md) ; les
// autres rôles n'ont pas encore de permissions modélisées à ce stade.
const ROLE_NAMES = ['client', 'restaurant', 'commerce', 'livreur', 'admin_dispatcher', 'direction'] as const;

// Dérivées des lignes ✔ de la colonne "Admin/Dispatcher" de la matrice de
// permissions (docs/acteurs.md). Pas de valeur financière ni de comportement
// câblé ici : uniquement les codes d'action.
const ADMIN_DISPATCHER_PERMISSIONS = [
  { code: 'commandes.consulter_toutes', description: 'Suivre toutes les commandes en temps réel, tous services' },
  { code: 'commandes.saisir_manuelle', description: "Saisir une demande reçue hors plateforme (téléphone, WhatsApp)" },
  { code: 'commandes.corriger_statut', description: 'Corriger manuellement le statut d’une course' },
  { code: 'commandes.valider_sensible', description: 'Valider une demande sensible' },
  { code: 'commandes.attribuer', description: 'Attribuer ou réattribuer une course' },
  { code: 'partenaires.gerer', description: 'Gérer les partenaires (création, commission, suspension)' },
  { code: 'partenaires.gerer_menu_pour_compte', description: 'Saisir menu/catalogue pour le compte d’un partenaire peu équipé' },
  { code: 'livreurs.gerer', description: 'Gérer les livreurs (pièces, zones, plafonds)' },
  { code: 'zones.gerer', description: 'Gérer les zones et grilles tarifaires' },
  { code: 'promotions.gerer', description: 'Gérer les promotions' },
  { code: 'caisse.rapprocher', description: 'Rapprochement et validation de la clôture de caisse, tous livreurs' },
  { code: 'portefeuilles.consulter_tous', description: 'Consulter et gérer le portefeuille de tous les livreurs' },
  { code: 'incidents.traiter', description: 'Traiter les incidents et litiges' },
  { code: 'statistiques.consulter_tout', description: 'Consulter les tableaux de bord et statistiques, tous services' },
  { code: 'donnees.exporter', description: 'Exporter des données (Excel/CSV)' },
] as const;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // V10 : le seed crée des comptes de démonstration à mot de passe connu
  // (`demo12345`) — jamais acceptable en production.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Le seed de développement ne doit jamais être exécuté en production (NODE_ENV=production).',
    );
  }

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

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'admin_dispatcher' } });
  for (const permission of ADMIN_DISPATCHER_PERMISSIONS) {
    const perm = await prisma.permission.findUniqueOrThrow({ where: { code: permission.code } });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  const zone = await prisma.zone.upsert({
    where: { nom: 'Natitingou centre' },
    update: {},
    create: { nom: 'Natitingou centre' },
  });

  // Tarif Colis "petit" pour la zone, valeur PROVISOIRE de développement (voir
  // schema.prisma, GrilleTarifaireColis) — jamais une recommandation métier.
  await prisma.grilleTarifaireColis.upsert({
    where: { zoneId: zone.id },
    update: {},
    create: { zoneId: zone.id, tarifBase: 800 },
  });

  // Tarif Courses express (course à un seul arrêt) pour la zone, valeur
  // PROVISOIRE de développement (voir schema.prisma,
  // GrilleTarifaireCoursesExpress) — jamais une recommandation métier.
  await prisma.grilleTarifaireCoursesExpress.upsert({
    where: { zoneId: zone.id },
    update: {},
    create: { zoneId: zone.id, tarifBase: 600 },
  });

  const restaurantRole = await prisma.role.findUniqueOrThrow({ where: { name: 'restaurant' } });
  const restaurantUser = await prisma.user.upsert({
    where: { telephone: DEMO_RESTAURANT.telephone },
    update: {},
    create: {
      telephone: DEMO_RESTAURANT.telephone,
      passwordHash: await bcrypt.hash(DEMO_RESTAURANT.motDePasse, SALT_ROUNDS),
      nom: DEMO_RESTAURANT.nom,
      roleId: restaurantRole.id,
    },
  });

  const restaurantPartenaire = await prisma.partenaire.upsert({
    where: { userId: restaurantUser.id },
    update: {
      description: DEMO_RESTAURANT.description,
      horaires: DEMO_RESTAURANT.horaires,
      tauxCommission: 15,
    },
    create: {
      userId: restaurantUser.id,
      nom: DEMO_RESTAURANT.nom,
      type: TypePartenaire.restaurant,
      description: DEMO_RESTAURANT.description,
      horaires: DEMO_RESTAURANT.horaires,
      zoneId: zone.id,
      statutOuverture: true,
      tauxCommission: 15,
    },
  });

  for (const plat of DEMO_RESTAURANT.plats) {
    const existing = await prisma.plat.findFirst({
      where: { partenaireId: restaurantPartenaire.id, nom: plat.nom },
    });
    if (!existing) {
      await prisma.plat.create({ data: { ...plat, partenaireId: restaurantPartenaire.id } });
    }
  }

  for (const restaurant of PILOT_RESTAURANTS) {
    const user = await prisma.user.upsert({
      where: { telephone: restaurant.telephone },
      update: {},
      create: {
        telephone: restaurant.telephone,
        passwordHash: await bcrypt.hash(restaurant.motDePasse, SALT_ROUNDS),
        nom: restaurant.nom,
        roleId: restaurantRole.id,
      },
    });

    const partenaireData = {
      nom: restaurant.nom,
      description: restaurant.description,
      adresse: restaurant.adresse,
      pointDeRepere: restaurant.pointDeRepere,
      horaires: restaurant.horaires,
      tauxCommission: 15,
    };
    const partenaire = await prisma.partenaire.upsert({
      where: { userId: user.id },
      update: partenaireData,
      create: {
        userId: user.id,
        type: TypePartenaire.restaurant,
        zoneId: zone.id,
        statutOuverture: true,
        ...partenaireData,
      },
    });

    for (const plat of restaurant.plats) {
      const existing = await prisma.plat.findFirst({
        where: { partenaireId: partenaire.id, nom: plat.nom },
      });
      if (!existing) {
        await prisma.plat.create({ data: { ...plat, partenaireId: partenaire.id } });
      }
    }
  }

  const clientRole = await prisma.role.findUniqueOrThrow({ where: { name: 'client' } });
  await prisma.user.upsert({
    where: { telephone: DEMO_CLIENT.telephone },
    update: {},
    create: {
      telephone: DEMO_CLIENT.telephone,
      passwordHash: await bcrypt.hash(DEMO_CLIENT.motDePasse, SALT_ROUNDS),
      nom: DEMO_CLIENT.nom,
      roleId: clientRole.id,
    },
  });

  const livreurRole = await prisma.role.findUniqueOrThrow({ where: { name: 'livreur' } });
  const livreurUser = await prisma.user.upsert({
    where: { telephone: DEMO_LIVREUR.telephone },
    update: {},
    create: {
      telephone: DEMO_LIVREUR.telephone,
      passwordHash: await bcrypt.hash(DEMO_LIVREUR.motDePasse, SALT_ROUNDS),
      nom: DEMO_LIVREUR.nom,
      roleId: livreurRole.id,
    },
  });
  await prisma.livreur.upsert({
    where: { userId: livreurUser.id },
    update: {},
    create: {
      userId: livreurUser.id,
      zoneId: zone.id,
      plafondAvance: DEMO_LIVREUR.plafondAvance,
      plafondCaisse: DEMO_LIVREUR.plafondCaisse,
      disponible: true,
    },
  });

  const adminRoleForUser = await prisma.role.findUniqueOrThrow({
    where: { name: 'admin_dispatcher' },
  });
  await prisma.user.upsert({
    where: { telephone: DEMO_ADMIN.telephone },
    update: {},
    create: {
      telephone: DEMO_ADMIN.telephone,
      passwordHash: await bcrypt.hash(DEMO_ADMIN.motDePasse, SALT_ROUNDS),
      nom: DEMO_ADMIN.nom,
      roleId: adminRoleForUser.id,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
