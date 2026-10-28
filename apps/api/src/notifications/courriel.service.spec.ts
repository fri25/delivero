import {
  ConsoleCourrielService,
  ResendCourrielService,
} from './courriel.service';

describe('CourrielService', () => {
  describe('ConsoleCourrielService', () => {
    it('enregistre le courriel dans les logs sans erreur avec options', async () => {
      const service = new ConsoleCourrielService();
      await expect(
        service.envoyer({
          a: 'client@example.com',
          objet: 'Votre commande',
          texte: 'Texte du message',
          html: '<p>HTML</p>',
        }),
      ).resolves.toBeUndefined();
    });

    it('enregistre le courriel avec arguments positionnels', async () => {
      const service = new ConsoleCourrielService();
      await expect(
        service.envoyer('client@example.com', 'Sujet', 'Corps du texte'),
      ).resolves.toBeUndefined();
    });
  });

  describe('ResendCourrielService', () => {
    it('envoie une requête HTTP POST à Resend avec les en-têtes et le payload attendus', async () => {
      const mockFetch = jest
        .fn<Promise<Response>, Parameters<typeof fetch>>()
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ id: 'email_123' }),
        } as Response);

      const service = new ResendCourrielService(
        {
          apiKey: 're_test_key_123',
          expediteur: 'ChapExpress <contact@chapexpress.bj>',
        },
        mockFetch,
      );

      await service.envoyer({
        destinataire: 'client@test.bj',
        sujet: 'Confirmation',
        texte: 'Contenu',
        html: '<p>Contenu</p>',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.resend.com/emails');
      expect(init?.method).toBe('POST');
      const headers = init?.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer re_test_key_123');
      expect(headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(init?.body as string) as Record<string, unknown>;
      expect(body.from).toBe('ChapExpress <contact@chapexpress.bj>');
      expect(body.to).toEqual(['client@test.bj']);
      expect(body.subject).toBe('Confirmation');
      expect(body.text).toBe('Contenu');
      expect(body.html).toBe('<p>Contenu</p>');
    });

    it('lève une erreur lorsque Resend répond avec une erreur HTTP', async () => {
      const mockFetch = jest
        .fn<Promise<Response>, Parameters<typeof fetch>>()
        .mockResolvedValue({
          ok: false,
          status: 422,
          text: () => Promise.resolve('Invalid recipient email'),
        } as Response);

      const service = new ResendCourrielService(
        {
          apiKey: 're_bad_key',
          expediteur: 'ChapExpress <contact@chapexpress.bj>',
        },
        mockFetch,
      );

      await expect(
        service.envoyer('invalid-email', 'Test', 'Corps'),
      ).rejects.toThrow('Resend 422 : Invalid recipient email');
    });
  });
});
