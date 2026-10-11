import { notificationStatut } from './messages-statut';

describe('notificationStatut', () => {
  it('notifies key steps with a link to the client order page', () => {
    expect(notificationStatut('colis', 'c1', 'livre')).toEqual({
      titre: 'Colis livré',
      message: 'Votre colis a été remis au destinataire.',
      url: '/colis/commandes/c1',
    });
    expect(notificationStatut('repas', 'r1', 'confirmee')?.url).toBe(
      '/commandes/r1',
    );
  });

  it('stays silent on intermediate statuses', () => {
    expect(notificationStatut('repas', 'r1', 'en_preparation')).toBeNull();
    expect(
      notificationStatut('courses_express', 'x', 'etape_realisee'),
    ).toBeNull();
  });
});
