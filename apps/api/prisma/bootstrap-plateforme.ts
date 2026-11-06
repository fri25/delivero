import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import {
  normaliserTelephoneBenin,
  variantesTelephone,
} from '../src/auth/telephone';
import { executerEnPlateforme } from '../src/tenancy/contexte-tenant';
import { clientScript } from './client-script';
import { assurerSocle } from './socle';

// First RapidLiv platform super-admin (étape 9 of
// docs/plan-migration-multi-tenant.md), on the model of bootstrap-admin.ts.
// Idempotent: an existing account (a CHAP EXPRESS admin, for instance) is
// added to platform_admins, its password is never overwritten. A platform
// account belongs to no company.
//
// PLATEFORME_TELEPHONE="+229..." PLATEFORME_MOT_DE_PASSE="..." PLATEFORME_NOM="..." \
//   pnpm --filter @delivero/api prisma:bootstrap-plateforme

const SALT_ROUNDS = 12;

const prisma = clientScript();

async function main() {
  const saisie = process.env.PLATEFORME_TELEPHONE?.trim() ?? '';
  const motDePasse = process.env.PLATEFORME_MOT_DE_PASSE ?? '';
  const nom = process.env.PLATEFORME_NOM?.trim() || 'Équipe RapidLiv';
  const telephone = normaliserTelephoneBenin(saisie);

  if (!telephone) {
    throw new Error('PLATEFORME_TELEPHONE : numéro béninois attendu.');
  }

  await assurerSocle(prisma);

  let user = await prisma.user.findFirst({
    where: { telephone: { in: variantesTelephone(telephone) } },
  });
  if (!user) {
    if (motDePasse.length < 12) {
      throw new Error(
        'PLATEFORME_MOT_DE_PASSE (12 caractères minimum) est obligatoire pour un nouveau compte.',
      );
    }
    user = await prisma.user.create({
      data: {
        telephone,
        nom,
        passwordHash: await bcrypt.hash(motDePasse, SALT_ROUNDS),
      },
    });
    console.log(`Compte ${telephone} créé.`);
  } else {
    console.log(`Compte ${user.telephone} existant : mot de passe inchangé.`);
  }

  await prisma.platformAdmin.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  console.log(`${user.telephone} est super-administrateur de la plateforme.`);
}

executerEnPlateforme(main)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
