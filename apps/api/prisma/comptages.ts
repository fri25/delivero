/**
 * Row counts and amount checksums of every table, to prove that a migration
 * loses no data (docs/plan-migration-multi-tenant.md, étape 0).
 *
 *   pnpm --filter @delivero/api comptages > avant.json
 *   (migration)
 *   pnpm --filter @delivero/api comptages -- --comparer avant.json
 *
 * Tables and numeric columns are discovered from information_schema, so new
 * tables are covered without editing this file. In comparison mode the
 * script exits with code 1 when a table lost rows or a sum changed; new
 * tables and new rows are reported but accepted (the app may write between
 * the two snapshots).
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

interface Comptage {
  lignes: number;
  sommes: Record<string, string>;
}
type Instantane = Record<string, Comptage>;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Identifiers come from information_schema, never from user input; quoting
// still guards against unusual names.
const ident = (nom: string) => `"${nom.replace(/"/g, '""')}"`;

async function instantane(): Promise<Instantane> {
  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      AND table_name <> '_prisma_migrations'
    ORDER BY table_name`;
  const colonnes = await prisma.$queryRaw<
    { table_name: string; column_name: string }[]
  >`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'numeric'
    ORDER BY table_name, column_name`;

  const resultat: Instantane = {};
  for (const { table_name: table } of tables) {
    const sommesDemandees = colonnes
      .filter((c) => c.table_name === table)
      .map((c) => c.column_name);
    const selection = [
      'count(*)::text AS lignes',
      ...sommesDemandees.map(
        (col, i) => `coalesce(sum(${ident(col)}), 0)::text AS s${i}`,
      ),
    ].join(', ');
    const [ligne] = await prisma.$queryRawUnsafe<Record<string, string>[]>(
      `SELECT ${selection} FROM ${ident(table)}`,
    );
    resultat[table] = {
      lignes: Number(ligne.lignes),
      sommes: Object.fromEntries(
        sommesDemandees.map((col, i) => [col, ligne[`s${i}`]]),
      ),
    };
  }
  return resultat;
}

function comparer(avant: Instantane, apres: Instantane): string[] {
  const ecarts: string[] = [];
  for (const [table, a] of Object.entries(avant)) {
    const b = apres[table];
    if (!b) {
      ecarts.push(`${table} : table disparue`);
      continue;
    }
    if (b.lignes < a.lignes)
      ecarts.push(`${table} : ${a.lignes} → ${b.lignes} lignes`);
    for (const [colonne, somme] of Object.entries(a.sommes)) {
      if (b.sommes[colonne] === undefined)
        ecarts.push(`${table}.${colonne} : colonne disparue`);
      else if (b.lignes === a.lignes && b.sommes[colonne] !== somme) {
        ecarts.push(
          `${table}.${colonne} : somme ${somme} → ${b.sommes[colonne]}`,
        );
      }
    }
  }
  return ecarts;
}

async function main() {
  const indexComparer = process.argv.indexOf('--comparer');
  const courant = await instantane();

  if (indexComparer === -1) {
    process.stdout.write(`${JSON.stringify(courant, null, 2)}\n`);
    return;
  }

  const avant = JSON.parse(
    readFileSync(process.argv[indexComparer + 1], 'utf8'),
  ) as Instantane;
  const ecarts = comparer(avant, courant);
  for (const table of Object.keys(courant).filter((t) => !avant[t])) {
    console.log(`+ ${table} (nouvelle table, ${courant[table].lignes} lignes)`);
  }
  for (const [table, b] of Object.entries(courant)) {
    const a = avant[table];
    if (a && b.lignes > a.lignes)
      console.log(`+ ${table} : ${a.lignes} → ${b.lignes} lignes`);
  }
  if (ecarts.length > 0) {
    console.error('Écarts :');
    for (const ecart of ecarts) console.error(`  - ${ecart}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Aucune perte : ${Object.keys(avant).length} tables vérifiées.`,
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
