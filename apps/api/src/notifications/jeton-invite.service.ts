import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * F-CLI-02: a guest order is reached through a capability link
 * `<commandeId>.<hmac>`. Nothing is stored: the signature is recomputed from
 * the order id, so no API response (restaurant, livreur, admin) can ever leak
 * a usable token, and notifications can rebuild the link at any time.
 *
 * Keyed with JWT_SECRET under a dedicated label (domain separation): rotating
 * that secret invalidates every guest link, like every session.
 */
@Injectable()
export class JetonInviteService {
  constructor(private readonly config: ConfigService) {}

  generer(commandeId: string): string {
    return `${commandeId}.${this.signature(commandeId)}`;
  }

  /** The order id if the token is authentic, null otherwise. */
  verifier(jeton: string): string | null {
    const point = jeton.lastIndexOf('.');
    if (point <= 0) {
      return null;
    }
    const commandeId = jeton.slice(0, point);
    const recue = Buffer.from(jeton.slice(point + 1));
    const attendue = Buffer.from(this.signature(commandeId));
    return recue.length === attendue.length && timingSafeEqual(recue, attendue)
      ? commandeId
      : null;
  }

  /** Client app page of a guest order. */
  lien(commandeId: string): string {
    const base = (this.config.get<string>('CLIENT_APP_URL') ?? '').replace(
      /\/+$/,
      '',
    );
    return `${base}/suivi/${this.generer(commandeId)}`;
  }

  private signature(commandeId: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('JWT_SECRET'))
      .update(`suivi-invite:${commandeId}`)
      .digest('base64url');
  }
}
