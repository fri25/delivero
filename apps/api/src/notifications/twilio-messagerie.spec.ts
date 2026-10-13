import { TwilioMessagerie, versE164 } from './twilio-messagerie';

function reponse(status: number, corps = '{}'): Response {
  return new Response(corps, { status });
}

function parametres(appel: unknown): URLSearchParams {
  return ((appel as unknown[])[1] as RequestInit).body as URLSearchParams;
}

describe('versE164', () => {
  it.each([
    ['+2290157866959', '+2290157866959'],
    ['01 57 86 69 59', '+2290157866959'],
    ['57866959', '+2290157866959'],
  ])('%s → %s', (entree, attendu) => {
    expect(versE164(entree)).toBe(attendu);
  });

  it('rejects an unusable number', () => {
    expect(versE164('123')).toBeNull();
  });
});

describe('TwilioMessagerie', () => {
  const config = {
    accountSid: 'AC123',
    authToken: 'secret',
    expediteurSms: '+15550000000',
  };

  it('sends an SMS when no WhatsApp sender is configured', async () => {
    const fetchMock = jest.fn().mockResolvedValue(reponse(201));
    await new TwilioMessagerie(config, fetchMock).envoyer(
      '0157866959',
      'Code : 123456',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const corps = parametres(fetchMock.mock.calls[0]);
    expect(corps.get('To')).toBe('+2290157866959');
    expect(corps.get('From')).toBe('+15550000000');
    expect(corps.get('Body')).toBe('Code : 123456');
  });

  it('tries WhatsApp first, then falls back to SMS', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(reponse(400, '{"code":63016}'))
      .mockResolvedValueOnce(reponse(201));
    await new TwilioMessagerie(
      { ...config, expediteurWhatsApp: '+14155238886' },
      fetchMock,
    ).envoyer('0157866959', 'Votre commande arrive');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(parametres(fetchMock.mock.calls[0]).get('To')).toBe(
      'whatsapp:+2290157866959',
    );
    expect(parametres(fetchMock.mock.calls[1]).get('To')).toBe(
      '+2290157866959',
    );
  });

  it('uses a Messaging Service SID instead of a From number', async () => {
    const fetchMock = jest.fn().mockResolvedValue(reponse(201));
    await new TwilioMessagerie(
      { ...config, expediteurSms: 'MG42' },
      fetchMock,
    ).envoyer('0157866959', 'x');
    const corps = parametres(fetchMock.mock.calls[0]);
    expect(corps.get('MessagingServiceSid')).toBe('MG42');
    expect(corps.has('From')).toBe(false);
  });

  it('rejects when Twilio refuses the SMS', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(reponse(401, '{"message":"Authenticate"}'));
    await expect(
      new TwilioMessagerie(config, fetchMock).envoyer('0157866959', 'x'),
    ).rejects.toThrow('Twilio 401');
  });
});
