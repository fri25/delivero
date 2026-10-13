import { Logger } from '@nestjs/common';
import { Messagerie } from './messagerie';

export interface ConfigTwilio {
  accountSid: string;
  authToken: string;
  /** Sender for SMS: a Twilio number (+1…) or a Messaging Service SID (MG…). */
  expediteurSms: string;
  /** Optional WhatsApp sender (+…); empty = SMS only. */
  expediteurWhatsApp?: string;
}

/**
 * Beninese number → E.164. Accepts the shapes found in the database:
 * "+22901…", "22901…", "01 57 86 69 59" and the pre-2024 8-digit format
 * (Benin added the 01 prefix in 2024). Same rule as
 * packages/config/whatsapp.ts on the front end.
 */
export function versE164(telephone: string): string | null {
  const chiffres = telephone.replace(/\D/g, '');
  if (chiffres.startsWith('229') && chiffres.length >= 11)
    return `+${chiffres}`;
  if (chiffres.length === 10) return `+229${chiffres}`;
  if (chiffres.length === 8) return `+22901${chiffres}`;
  return null;
}

/**
 * WhatsApp/SMS through Twilio (decision of 13/10), via its REST API (no SDK:
 * one endpoint is all we need).
 *
 * WhatsApp is tried first when a sender is configured, then SMS. WhatsApp
 * rejects free-form business-initiated messages outside the 24 h window
 * until Twilio-approved templates exist: the SMS fallback covers that case,
 * so an OTP code or an alert always goes out on one channel or the other.
 */
export class TwilioMessagerie extends Messagerie {
  private readonly logger = new Logger('Messagerie');

  constructor(
    private readonly config: ConfigTwilio,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    super();
  }

  async envoyer(telephone: string, texte: string): Promise<void> {
    const destinataire = versE164(telephone);
    if (!destinataire) {
      throw new Error(`Numéro inexploitable pour WhatsApp/SMS : ${telephone}`);
    }

    if (this.config.expediteurWhatsApp) {
      try {
        await this.poster(
          `whatsapp:${this.config.expediteurWhatsApp}`,
          `whatsapp:${destinataire}`,
          texte,
        );
        return;
      } catch (error) {
        this.logger.warn(
          `WhatsApp refusé pour ${destinataire}, repli SMS : ${(error as Error).message}`,
        );
      }
    }
    await this.poster(this.config.expediteurSms, destinataire, texte);
  }

  private async poster(from: string, to: string, body: string): Promise<void> {
    const { accountSid, authToken } = this.config;
    const parametres = new URLSearchParams({ To: to, Body: body });
    // A Messaging Service SID replaces the From number.
    parametres.set(
      from.startsWith('MG') ? 'MessagingServiceSid' : 'From',
      from,
    );

    const response = await this.fetchImpl(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: parametres,
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) {
      // Twilio's error body (code + message) never contains the token.
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`Twilio ${response.status} : ${detail}`);
    }
  }
}
