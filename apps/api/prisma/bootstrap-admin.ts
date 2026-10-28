import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { assurerSocle } from './socle';

// Production counterpart of seed.ts: creates the roles/permissions and the
// first back-office account, nothing else (no demo data). Idempotent: an
// existing account is left untouched, its password is never overwritten.
//
// ADMIN_TELEPHONE="+229..." ADMIN_MOT_DE_PASSE="..." ADMIN_NOM="..." \
//   node dist/prisma/bootstrap-admin.js

const SALT_ROUNDS = 12;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const telephone = process.env.ADMIN_TELEPHONE?.trim();
  const motDePasse = process.env.ADMIN_MOT_DE_PASSE ?? '';
  const nom = process.env.ADMIN_NOM?.trim() || 'Administrateur';

  if (!telephone || motDePasse.length < 10) {
    throw new Error(
      'ADMIN_TELEPHONE et ADMIN_MOT_DE_PASSE (10 caractères minimum) sont obligatoires.',
    );
  }

  await assurerSocle(prisma);

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'admin_dispatcher' },
  });
  const existant = await prisma.user.findUnique({ where: { telephone } });
  if (existant) {
    console.log(`Compte ${telephone} déjà présent : inchangé.`);
    return;
  }

  await prisma.user.create({
    data: {
      telephone,
      passwordHash: await bcrypt.hash(motDePasse, SALT_ROUNDS),
      nom,
      roleId: adminRole.id,
    },
  });
  console.log(`Compte admin_dispatcher ${telephone} créé.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
