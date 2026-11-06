import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const VERSION = 'v1';

/**
 * Per-company credentials in tenant_secrets (FedaPay of each company,
 * decision Q-MT-4), encrypted with AES-256-GCM. The master key
 * (TENANT_SECRETS_KEY, 32 bytes in base64) only lives in the environment:
 * a dump of the database alone reveals no credential. Values are never
 * returned to a client.
 */
@Injectable()
export class SecretsTenantService {
  private readonly logger = new Logger(SecretsTenantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async lire(tenantId: string, cle: string): Promise<string | null> {
    const ligne = await this.prisma.tenantSecret.findUnique({
      where: { tenantId_cle: { tenantId, cle } },
    });
    if (!ligne) return null;
    const maitre = this.cleMaitre();
    if (!maitre) {
      this.logger.error(
        `Secret ${cle} présent mais TENANT_SECRETS_KEY absente : illisible.`,
      );
      return null;
    }
    return dechiffrer(ligne.valeurChiffree, maitre);
  }

  async ecrire(tenantId: string, cle: string, valeur: string): Promise<void> {
    const maitre = this.cleMaitre();
    if (!maitre) {
      // 503: a missing server setting, not a fault of the caller.
      throw new ServiceUnavailableException(
        'Enregistrement des identifiants indisponible : TENANT_SECRETS_KEY absente du serveur.',
      );
    }
    const valeurChiffree = chiffrer(valeur, maitre);
    await this.prisma.tenantSecret.upsert({
      where: { tenantId_cle: { tenantId, cle } },
      create: { tenantId, cle, valeurChiffree },
      update: { valeurChiffree },
    });
  }

  private cleMaitre(): Buffer | null {
    const brute = this.config.get<string>('TENANT_SECRETS_KEY');
    return brute ? Buffer.from(brute, 'base64') : null;
  }
}

/** `v1.<iv>.<tag>.<ciphertext>`, each part in base64. */
export function chiffrer(valeur: string, cle: Buffer): string {
  const iv = randomBytes(12);
  const chiffreur = createCipheriv('aes-256-gcm', cle, iv);
  const corps = Buffer.concat([
    chiffreur.update(valeur, 'utf8'),
    chiffreur.final(),
  ]);
  return [VERSION, iv, chiffreur.getAuthTag(), corps]
    .map((partie) =>
      typeof partie === 'string' ? partie : partie.toString('base64'),
    )
    .join('.');
}

export function dechiffrer(stocke: string, cle: Buffer): string {
  const [version, iv, tag, corps] = stocke.split('.');
  if (version !== VERSION || !iv || !tag || !corps) {
    throw new Error('Secret dans un format inconnu.');
  }
  const dechiffreur = createDecipheriv(
    'aes-256-gcm',
    cle,
    Buffer.from(iv, 'base64'),
  );
  dechiffreur.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([
    dechiffreur.update(Buffer.from(corps, 'base64')),
    dechiffreur.final(),
  ]).toString('utf8');
}
