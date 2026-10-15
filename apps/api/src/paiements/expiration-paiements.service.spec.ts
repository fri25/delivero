import type { Prisma } from '@prisma/client';
import type { NotificationsService } from '../notifications/notifications.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  DELAI_EXPIRATION_MS,
  ExpirationPaiementsService,
  MOTIF_EXPIRATION,
} from './expiration-paiements.service';
import type { PaiementsService } from './paiements.service';

const MAINTENANT = new Date('2026-10-13T12:00:00Z');

function commandeColis(referenceTransaction: string | null = null) {
  return {
    id: 'c1',
    typeService: 'colis',
    clientId: 'u1',
    clientTelephoneInvite: null,
    clientEmailInvite: null,
    paiement: { referenceTransaction },
    commandeRepas: null,
    commandeColis: { id: 'colis-1' },
    commandeEmplettes: null,
    commandeCoursesExpress: null,
  };
}

function monter(
  commandes: unknown[],
  { annulees = 1, statutFedapay = 'en_attente' } = {},
) {
  const findMany = jest
    .fn<Promise<unknown[]>, [Prisma.CommandeFindManyArgs]>()
    .mockResolvedValue(commandes);
  const colisUpdateMany = jest
    .fn<Promise<{ count: number }>, [Prisma.CommandeColisUpdateManyArgs]>()
    .mockResolvedValue({ count: annulees });
  const commandeUpdate = jest.fn().mockResolvedValue({});
  const tx = {
    commandeColis: { updateMany: colisUpdateMany },
    commande: { update: commandeUpdate },
  };
  const prisma = {
    commande: { findMany },
    $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
  } as unknown as PrismaService;
  const resynchroniser = jest.fn().mockResolvedValue(statutFedapay);
  const emitToUser = jest.fn();
  const commandeAnnuleeParChapExpress = jest.fn();
  const service = new ExpirationPaiementsService(
    prisma,
    { resynchroniser } as unknown as PaiementsService,
    { emitToUser } as unknown as RealtimeGateway,
    { commandeAnnuleeParChapExpress } as unknown as NotificationsService,
  );
  return {
    service,
    findMany,
    colisUpdateMany,
    commandeUpdate,
    resynchroniser,
    emitToUser,
    commandeAnnuleeParChapExpress,
  };
}

describe('ExpirationPaiementsService.executer', () => {
  it('only looks at Mobile Money payments older than 30 minutes', async () => {
    const { service, findMany } = monter([]);
    await service.executer(MAINTENANT);

    expect(findMany.mock.calls[0][0].where?.paiement).toEqual({
      is: {
        mode: 'mobile_money',
        statut: { in: ['en_attente', 'echoue'] },
        createdAt: {
          lt: new Date(MAINTENANT.getTime() - DELAI_EXPIRATION_MS),
        },
      },
    });
  });

  it('cancels an unpaid order, records why and tells the client', async () => {
    const m = monter([commandeColis()]);
    expect(await m.service.executer(MAINTENANT)).toBe(1);

    // Conditional on the payment still being unpaid.
    expect(m.colisUpdateMany.mock.calls[0][0]).toEqual({
      where: {
        commandeId: 'c1',
        statut: 'confirmee',
        commande: {
          paiement: { is: { statut: { in: ['en_attente', 'echoue'] } } },
        },
      },
      data: { statut: 'annulee' },
    });
    expect(m.commandeUpdate).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { motifAnnulation: MOTIF_EXPIRATION, annuleeAt: MAINTENANT },
    });
    expect(m.emitToUser).toHaveBeenCalledWith('u1', 'commande:statut', {
      typeService: 'colis',
      commandeId: 'colis-1',
      statut: 'annulee',
    });
    expect(m.commandeAnnuleeParChapExpress).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1' }),
      MOTIF_EXPIRATION,
    );
    // Never opened a FedaPay page: nothing to re-read.
    expect(m.resynchroniser).not.toHaveBeenCalled();
  });

  it('keeps an order FedaPay turns out to have paid (lost webhook)', async () => {
    const m = monter([commandeColis('fp-42')], { statutFedapay: 'reussi' });
    expect(await m.service.executer(MAINTENANT)).toBe(0);
    expect(m.resynchroniser).toHaveBeenCalledWith('c1');
    expect(m.colisUpdateMany).not.toHaveBeenCalled();
  });

  it('does nothing when the payment was confirmed in the meantime', async () => {
    const m = monter([commandeColis()], { annulees: 0 });
    expect(await m.service.executer(MAINTENANT)).toBe(0);
    expect(m.commandeUpdate).not.toHaveBeenCalled();
    expect(m.commandeAnnuleeParChapExpress).not.toHaveBeenCalled();
  });

  it('retries later when FedaPay cannot be reached', async () => {
    const m = monter([commandeColis('fp-42')]);
    m.resynchroniser.mockRejectedValue(new Error('réseau'));
    expect(await m.service.executer(MAINTENANT)).toBe(0);
    expect(m.colisUpdateMany).not.toHaveBeenCalled();
  });
});
