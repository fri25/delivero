import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Minimal REST client for FedaPay (F-ADM-16), without the official SDK: only
// 3 calls are needed, and the SDK relies on global state (setApiKey).
// References: docs.fedapay.com/api-reference/transactions/*; signature check
// mirrors fedapay-node (src/Webhook.ts).

const BASE_URLS = {
  sandbox: 'https://sandbox-api.fedapay.com/v1',
  live: 'https://api.fedapay.com/v1',
} as const;

// Same tolerance as the official SDK (DEFAULT_TOLERANCE = 300 s).
const WEBHOOK_TOLERANCE_SECONDES = 300;

export interface TransactionFedapay {
  id: number;
  /** pending, approved, declined, canceled, refunded or transferred. */
  status: string;
  amount: number;
}

export interface CreerTransactionInput {
  montant: number;
  description: string;
  callbackUrl: string;
  client: { prenom: string; nom: string; telephone: string };
  metadata: Record<string, string>;
}

@Injectable()
export class FedapayClient {
  private readonly logger = new Logger(FedapayClient.name);

  constructor(private readonly config: ConfigService) {}

  estConfigure(): boolean {
    return Boolean(this.config.get<string>('FEDAPAY_SECRET_KEY'));
  }

  async creerTransaction(
    input: CreerTransactionInput,
  ): Promise<TransactionFedapay> {
    const body = await this.requete('POST', '/transactions', {
      description: input.description,
      amount: input.montant,
      currency: { iso: 'XOF' },
      callback_url: input.callbackUrl,
      customer: {
        firstname: input.client.prenom,
        lastname: input.client.nom,
        phone_number: {
          number: numeroLocalBenin(input.client.telephone),
          country: 'bj',
        },
      },
      custom_metadata: input.metadata,
    });
    return extraireTransaction(body);
  }

  /** Link to the payment page hosted by FedaPay. */
  async genererLienPaiement(transactionId: number | string): Promise<string> {
    const body = (await this.requete(
      'POST',
      `/transactions/${transactionId}/token`,
    )) as { url?: string };
    if (!body.url) {
      throw new ServiceUnavailableException(
        'Lien de paiement indisponible. Réessayez dans un instant.',
      );
    }
    return body.url;
  }

  async lireTransaction(
    transactionId: number | string,
  ): Promise<TransactionFedapay> {
    return extraireTransaction(
      await this.requete('GET', `/transactions/${transactionId}`),
    );
  }

  /**
   * `X-FEDAPAY-SIGNATURE` header: `t=<timestamp>,s=<hmac>`, where hmac is the
   * hex HMAC-SHA256 of `<timestamp>.<raw body>` keyed with the webhook
   * endpoint secret.
   */
  verifierSignatureWebhook(
    corpsBrut: string,
    entete: string | undefined,
    maintenantSecondes = Math.floor(Date.now() / 1000),
  ): boolean {
    const secret = this.config.get<string>('FEDAPAY_WEBHOOK_SECRET');
    if (!secret || !entete) {
      return false;
    }
    return signatureWebhookValide(
      corpsBrut,
      entete,
      secret,
      maintenantSecondes,
    );
  }

  private async requete(
    method: 'GET' | 'POST',
    chemin: string,
    body?: unknown,
  ): Promise<unknown> {
    const secretKey = this.config.get<string>('FEDAPAY_SECRET_KEY');
    if (!secretKey) {
      throw new ServiceUnavailableException(
        'Le paiement Mobile Money est momentanément indisponible.',
      );
    }
    const environnement =
      this.config.get<'sandbox' | 'live'>('FEDAPAY_ENVIRONMENT') ?? 'sandbox';

    let response: Response;
    try {
      response = await fetch(`${BASE_URLS[environnement]}${chemin}`, {
        method,
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      this.logger.error(`FedaPay injoignable (${method} ${chemin})`, error);
      throw new ServiceUnavailableException(
        'Le service de paiement est injoignable. Réessayez dans un instant.',
      );
    }

    const texte = await response.text();
    if (!response.ok) {
      // The body may hold useful diagnostics; it never contains the key.
      this.logger.error(
        `FedaPay ${response.status} sur ${method} ${chemin} : ${texte.slice(0, 500)}`,
      );
      throw new ServiceUnavailableException(
        'Le paiement n’a pas pu être initié. Réessayez dans un instant.',
      );
    }
    return texte ? (JSON.parse(texte) as unknown) : {};
  }
}

// Depending on the API version, the transaction is returned at the root or
// wrapped under the "v1/transaction" key: accept both.
export function extraireTransaction(body: unknown): TransactionFedapay {
  const enveloppe = body as Record<string, unknown>;
  const transaction = (enveloppe['v1/transaction'] ??
    enveloppe) as Partial<TransactionFedapay>;
  if (
    typeof transaction?.id !== 'number' &&
    typeof transaction?.id !== 'string'
  ) {
    throw new ServiceUnavailableException(
      'Réponse inattendue du service de paiement.',
    );
  }
  return {
    id: Number(transaction.id),
    status: String(transaction.status ?? ''),
    amount: Number(transaction.amount ?? 0),
  };
}

export function signatureWebhookValide(
  corpsBrut: string,
  entete: string,
  secret: string,
  maintenantSecondes: number,
): boolean {
  const morceaux = Object.fromEntries(
    entete.split(',').map((morceau) => {
      const [cle, ...valeur] = morceau.trim().split('=');
      return [cle, valeur.join('=')];
    }),
  );
  const timestamp = Number(morceaux.t);
  const signature = morceaux.s;
  if (!Number.isFinite(timestamp) || !signature) {
    return false;
  }
  if (Math.abs(maintenantSecondes - timestamp) > WEBHOOK_TOLERANCE_SECONDES) {
    return false;
  }

  const attendue = createHmac('sha256', secret)
    .update(`${timestamp}.${corpsBrut}`, 'utf8')
    .digest('hex');
  const a = Buffer.from(attendue, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

// Phones are stored in international format (+229…); FedaPay expects the
// national number alongside the country code.
export function numeroLocalBenin(telephone: string): string {
  return telephone.replace(/\s+/g, '').replace(/^(\+|00)229/, '');
}
