import type { PrismaService } from '../prisma/prisma.service';
import type { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  AlertesLivreursService,
  EVENEMENT_COURSE_ATTRIBUEE,
  EVENEMENT_COURSE_DISPONIBLE,
} from './alertes-livreurs.service';
import type { NotificationsService } from './notifications.service';

const LIVREURS = [
  { userId: 'u-dispo', disponible: true },
  { userId: 'u-pause', disponible: false },
];

function monter(commande: Record<string, unknown> | null) {
  const findLivreurs = jest.fn().mockResolvedValue(LIVREURS);
  const emitToUser = jest.fn();
  const courseDisponibleLivreur = jest.fn();
  const courseAttribueeLivreur = jest.fn();
  const prisma = {
    commande: { findUnique: jest.fn().mockResolvedValue(commande) },
    livreur: { findMany: findLivreurs },
  } as unknown as PrismaService;
  const service = new AlertesLivreursService(
    prisma,
    { emitToUser } as unknown as RealtimeGateway,
    {
      courseDisponibleLivreur,
      courseAttribueeLivreur,
    } as unknown as NotificationsService,
  );
  return {
    service,
    findLivreurs,
    emitToUser,
    courseDisponibleLivreur,
    courseAttribueeLivreur,
  };
}

// courseDisponible is fire-and-forget: let its promise chain settle.
const attendre = () => new Promise((resolve) => setImmediate(resolve));

describe('AlertesLivreursService.courseDisponible', () => {
  it('refreshes every livreur of the zone but only notifies available ones', async () => {
    const { service, findLivreurs, emitToUser, courseDisponibleLivreur } =
      monter({
        typeService: 'colis',
        livreurId: null,
        commandeColis: { zoneId: 'z1', programmationAt: null },
      });
    service.courseDisponible('c1');
    await attendre();

    expect(findLivreurs).toHaveBeenCalledWith(
      expect.objectContaining({ where: { zoneId: 'z1' } }),
    );
    expect(emitToUser).toHaveBeenCalledTimes(2);
    expect(emitToUser).toHaveBeenCalledWith(
      'u-pause',
      EVENEMENT_COURSE_DISPONIBLE,
      { typeService: 'colis' },
    );
    expect(courseDisponibleLivreur).toHaveBeenCalledTimes(1);
    expect(courseDisponibleLivreur).toHaveBeenCalledWith(
      'u-dispo',
      expect.objectContaining({ titre: 'Nouvelle course', url: '/' }),
    );
  });

  it('uses the restaurant zone for a Repas', async () => {
    const { service, findLivreurs } = monter({
      typeService: 'repas',
      livreurId: null,
      commandeRepas: { partenaire: { zoneId: 'z-resto' } },
    });
    service.courseDisponible('c1');
    await attendre();
    expect(findLivreurs).toHaveBeenCalledWith(
      expect.objectContaining({ where: { zoneId: 'z-resto' } }),
    );
  });

  it('stays silent for an order already assigned', async () => {
    const { service, emitToUser, courseDisponibleLivreur } = monter({
      typeService: 'colis',
      livreurId: 'l1',
      commandeColis: { zoneId: 'z1', programmationAt: null },
    });
    service.courseDisponible('c1');
    await attendre();
    expect(emitToUser).not.toHaveBeenCalled();
    expect(courseDisponibleLivreur).not.toHaveBeenCalled();
  });

  it('waits for a scheduled pick-up', async () => {
    const { service, emitToUser } = monter({
      typeService: 'colis',
      livreurId: null,
      commandeColis: {
        zoneId: 'z1',
        programmationAt: new Date(Date.now() + 3_600_000),
      },
    });
    service.courseDisponible('c1');
    await attendre();
    expect(emitToUser).not.toHaveBeenCalled();
  });
});

describe('AlertesLivreursService.courseAttribuee', () => {
  it('tells the chosen livreur, in real time and by notification', () => {
    const { service, emitToUser, courseAttribueeLivreur } = monter(null);
    service.courseAttribuee('u-dispo', 'c1');
    expect(emitToUser).toHaveBeenCalledWith(
      'u-dispo',
      EVENEMENT_COURSE_ATTRIBUEE,
      { commandeId: 'c1' },
    );
    expect(courseAttribueeLivreur).toHaveBeenCalledWith('u-dispo');
  });
});
