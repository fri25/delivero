import { Injectable, Logger } from '@nestjs/common';

/**
 * WhatsApp/SMS channel, provider-agnostic (decision of 2026-10-05: provider
 * chosen later). Mandatory fallback for every alert (local constraint, see
 * CLAUDE.md) and transport for OTP codes.
 *
 * To plug a real provider: implement this class (e.g. TwilioMessagerie) and
 * select it in NotificationsModule from MESSAGERIE_FOURNISSEUR.
 */
export abstract class Messagerie {
  /** Resolves once the provider accepted the message; rejects otherwise. */
  abstract envoyer(telephone: string, texte: string): Promise<void>;
}

/**
 * Development driver: writes the message to the API logs instead of sending
 * it — including OTP codes, which is why NotificationsModule logs an error
 * when it is selected in production.
 */
@Injectable()
export class ConsoleMessagerie extends Messagerie {
  private readonly logger = new Logger('Messagerie');

  envoyer(telephone: string, texte: string): Promise<void> {
    // Never log message bodies (OTP codes) in production: docker logs are
    // readable by anyone with server access.
    const contenu =
      process.env.NODE_ENV === 'production'
        ? `(${texte.length} caractères, masqué en production)`
        : texte;
    this.logger.log(`[WhatsApp/SMS -> ${telephone}] ${contenu}`);
    return Promise.resolve();
  }
}
