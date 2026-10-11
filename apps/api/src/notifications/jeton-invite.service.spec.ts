import { ConfigService } from '@nestjs/config';
import { JetonInviteService } from './jeton-invite.service';

const service = (secret = 'x'.repeat(32)) =>
  new JetonInviteService(
    new ConfigService({
      JWT_SECRET: secret,
      CLIENT_APP_URL: 'https://app.chapexpress.bj/',
    }),
  );

describe('JetonInviteService', () => {
  it('round-trips a generated token to its order id', () => {
    const jetons = service();
    expect(jetons.verifier(jetons.generer('cmd_123'))).toBe('cmd_123');
  });

  it('rejects a forged, altered or foreign token', () => {
    const jetons = service();
    const valide = jetons.generer('cmd_123');
    expect(jetons.verifier(valide.replace('cmd_123', 'cmd_124'))).toBeNull();
    expect(jetons.verifier(`${valide}x`)).toBeNull();
    expect(jetons.verifier('cmd_123')).toBeNull();
    expect(jetons.verifier('.abc')).toBeNull();
    expect(service('y'.repeat(32)).verifier(valide)).toBeNull();
  });

  it('builds the client tracking link', () => {
    const jetons = service();
    expect(jetons.lien('cmd_1')).toBe(
      `https://app.chapexpress.bj/suivi/${jetons.generer('cmd_1')}`,
    );
  });
});
