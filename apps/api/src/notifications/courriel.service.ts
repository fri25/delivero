import { Injectable, Logger } from '@nestjs/common';

export interface EnvoiCourrielOptions {
  destinataire?: string;
  a?: string;
  sujet?: string;
  objet?: string;
  texte: string;
  html?: string;
}

/**
 * F-CLI-09: Courriel / E-mail channel, provider-agnostic.
 * Sends key milestone notifications to users or guest orders who provided an email.
 */
export abstract class CourrielService {
  /** Resolves once the email provider accepted the message; rejects otherwise. */
  abstract envoyer(
    destinataireOrOptions: string | EnvoiCourrielOptions,
    sujet?: string,
    texte?: string,
    html?: string,
  ): Promise<void>;
}

/**
 * Development driver: writes the email to API logs.
 */
@Injectable()
export class ConsoleCourrielService extends CourrielService {
  private readonly logger = new Logger('Courriel');

  envoyer(
    destinataireOrOptions: string | EnvoiCourrielOptions,
    sujet?: string,
    texte?: string,
    html?: string,
  ): Promise<void> {
    const { destinataire, sujet: s, texte: t, html: h } = extraireParametres(
      destinataireOrOptions,
      sujet,
      texte,
      html,
    );

    this.logger.log(
      `[E-mail -> ${destinataire}] Sujet: "${s}"\n${t}${h ? `\n(HTML inclus)` : ''}`,
    );
    return Promise.resolve();
  }
}

export interface ConfigResend {
  apiKey: string;
  expediteur: string;
}

/**
 * Production driver using Resend (https://resend.com) HTTP API.
 */
export class ResendCourrielService extends CourrielService {
  constructor(
    private readonly config: ConfigResend,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    super();
  }

  async envoyer(
    destinataireOrOptions: string | EnvoiCourrielOptions,
    sujet?: string,
    texte?: string,
    html?: string,
  ): Promise<void> {
    const { destinataire, sujet: s, texte: t, html: h } = extraireParametres(
      destinataireOrOptions,
      sujet,
      texte,
      html,
    );

    const response = await this.fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.expediteur,
        to: [destinataire],
        subject: s,
        text: t,
        html: h ?? `<p>${t.replace(/\n/g, '<br/>')}</p>`,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`Resend ${response.status} : ${detail}`);
    }
  }
}

function extraireParametres(
  destinataireOrOptions: string | EnvoiCourrielOptions,
  sujet?: string,
  texte?: string,
  html?: string,
): { destinataire: string; sujet: string; texte: string; html?: string } {
  if (typeof destinataireOrOptions === 'string') {
    return {
      destinataire: destinataireOrOptions,
      sujet: sujet ?? '',
      texte: texte ?? '',
      html,
    };
  }
  return {
    destinataire:
      destinataireOrOptions.destinataire ?? destinataireOrOptions.a ?? '',
    sujet: destinataireOrOptions.sujet ?? destinataireOrOptions.objet ?? '',
    texte: destinataireOrOptions.texte ?? '',
    html: destinataireOrOptions.html,
  };
}
