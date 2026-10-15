import { createHash } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Photos (F-CLI-16 colis, F-CLI-23 courses express) stored on Cloudinary
// (decision of 2026-10-06). The browser uploads straight to Cloudinary with a
// short-lived signature from this service — files never transit through the
// API, which matters on a 3G link — and the order only stores the URL.

export const USAGES_MEDIA = ['colis', 'courses', 'plats'] as const;
export type UsageMedia = (typeof USAGES_MEDIA)[number];

// Only images: anything else is refused by Cloudinary itself, the format list
// being part of the signed parameters.
const FORMATS_AUTORISES = 'jpg,jpeg,png,webp';
const RACINE = 'chapexpress';

/** Same ceiling as the client-side compression target (exigences NF). */
export const TAILLE_MAX_OCTETS = 300 * 1024;

@Injectable()
export class MediasService {
  constructor(private readonly config: ConfigService) {}

  private get cloudName() {
    return this.config.get<string>('CLOUDINARY_CLOUD_NAME') ?? '';
  }

  estActif(): boolean {
    return Boolean(
      this.cloudName &&
      this.config.get<string>('CLOUDINARY_API_KEY') &&
      this.config.get<string>('CLOUDINARY_API_SECRET'),
    );
  }

  configPublique() {
    return { actif: this.estActif(), tailleMaxOctets: TAILLE_MAX_OCTETS };
  }

  /**
   * Signed upload parameters: Cloudinary's scheme is the SHA-1 of the sorted
   * `key=value` pairs joined by `&`, followed by the API secret.
   */
  signer(usage: UsageMedia) {
    if (!this.estActif()) {
      throw new ServiceUnavailableException(
        'L’envoi de photos n’est pas disponible pour le moment.',
      );
    }
    const parametres: Record<string, string> = {
      allowed_formats: FORMATS_AUTORISES,
      folder: `${RACINE}/${usage}`,
      timestamp: Math.floor(Date.now() / 1000).toString(),
    };
    return {
      cloudName: this.cloudName,
      apiKey: this.config.get<string>('CLOUDINARY_API_KEY')!,
      ...parametres,
      signature: signerParametres(
        parametres,
        this.config.get<string>('CLOUDINARY_API_SECRET')!,
      ),
    };
  }

  /**
   * An order may only reference images uploaded to our own Cloudinary account
   * in the folder of that usage — never an arbitrary URL.
   */
  assertUrlsAutorisees(urls: string[] | undefined, usage: UsageMedia) {
    if (!urls || urls.length === 0) {
      return;
    }
    const prefixe = `https://res.cloudinary.com/${this.cloudName}/image/upload/`;
    for (const url of urls) {
      if (
        !this.estActif() ||
        !url.startsWith(prefixe) ||
        !url.includes(`/${RACINE}/${usage}/`)
      ) {
        throw new BadRequestException('Photo non reconnue. Renvoyez-la.');
      }
    }
  }
}

export function signerParametres(
  parametres: Record<string, string>,
  secret: string,
): string {
  const chaine = Object.keys(parametres)
    .sort()
    .map((cle) => `${cle}=${parametres[cle]}`)
    .join('&');
  return createHash('sha1')
    .update(chaine + secret)
    .digest('hex');
}
