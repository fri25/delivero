import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QuartiersService } from './quartiers.service';

const KANTABORIFA = {
  id: 'q-kant',
  nom: 'Kantaborifa',
  fraisLivraison: new Prisma.Decimal(500),
  autre: false,
  actif: true,
};
const AUTRE = {
  ...KANTABORIFA,
  id: 'q-autre',
  nom: 'Autre quartier',
  fraisLivraison: new Prisma.Decimal(1000),
  autre: true,
};
const FERME = { ...KANTABORIFA, id: 'q-ferme', nom: 'Ancien', actif: false };

function service() {
  const parId = new Map([KANTABORIFA, AUTRE, FERME].map((q) => [q.id, q]));
  const prisma = {
    quartier: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(parId.get(where.id) ?? null),
      ),
    },
  } as unknown as PrismaService;
  return new QuartiersService(prisma);
}

describe('QuartiersService.resoudre', () => {
  it('returns the listed neighbourhood with its own name', async () => {
    const { quartier, nom } = await service().resoudre('q-kant', 'ignored');
    expect(quartier.id).toBe('q-kant');
    expect(nom).toBe('Kantaborifa');
  });

  it('keeps the name typed for "Autre quartier"', async () => {
    const { quartier, nom } = await service().resoudre(
      'q-autre',
      '  Péporiyakou ',
    );
    expect(Number(quartier.fraisLivraison)).toBe(1000);
    expect(nom).toBe('Péporiyakou');
  });

  it('requires a name for "Autre quartier"', async () => {
    await expect(service().resoudre('q-autre', '  ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuses an unknown or inactive neighbourhood', async () => {
    await expect(service().resoudre('nope', null)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service().resoudre('q-ferme', null)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
