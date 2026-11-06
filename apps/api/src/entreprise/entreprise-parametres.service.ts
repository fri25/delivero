import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TENANT_PAR_DEFAUT } from '../auth/appartenance';
import { normaliserTelephoneBenin } from '../auth/telephone';
import { PrismaService } from '../prisma/prisma.service';
import { tenantCourant } from '../tenancy/contexte-tenant';
import { ParametresTenantService } from '../tenancy/parametres-tenant.service';
import { SecretsTenantService } from '../tenancy/secrets-tenant.service';
import type { FedapayDto } from './dto/fedapay.dto';
import type { ModifierParametresDto } from './dto/modifier-parametres.dto';

const CLES_FEDAPAY = {
  cleSecrete: 'fedapay.cle_secrete',
  secretWebhook: 'fedapay.secret_webhook',
  environnement: 'fedapay.environnement',
} as const;

/**
 * Settings screen of the company back-office (étape 8 of
 * docs/plan-migration-multi-tenant.md). tenant_settings is a platform table:
 * every query names the company of the request explicitly.
 */
@Injectable()
export class EntrepriseParametresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parametres: ParametresTenantService,
    private readonly secrets: SecretsTenantService,
    private readonly config: ConfigService,
  ) {}

  async lire() {
    const tenantId = tenantCourant();
    const [tenant, ligne] = await Promise.all([
      this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
      this.prisma.tenantSettings.findUniqueOrThrow({ where: { tenantId } }),
    ]);
    return {
      slug: tenant.slug,
      nomCommercial: ligne.nomCommercial,
      logoUrl: ligne.logoUrl,
      couleurPrimaire: ligne.couleurPrimaire,
      couleurMarine: ligne.couleurMarine,
      couleurSignal: ligne.couleurSignal,
      telephoneContact: ligne.telephoneContact,
      whatsappSupport: ligne.whatsappSupport,
      emailContact: ligne.emailContact,
      ville: ligne.ville,
      pays: ligne.pays,
      devise: ligne.devise,
      fuseauHoraire: ligne.fuseauHoraire,
      indicatifTelephone: ligne.indicatifTelephone,
      tauxCommission: Number(ligne.tauxCommission),
      fedapay: await this.etatFedapay(tenantId, tenant.slug),
    };
  }

  async modifier(dto: ModifierParametresDto) {
    const tenantId = tenantCourant();
    await this.prisma.tenantSettings.update({
      where: { tenantId },
      data: {
        ...dto,
        telephoneContact: telephoneOuNull(dto.telephoneContact),
        whatsappSupport: telephoneOuNull(dto.whatsappSupport),
      },
    });
    this.parametres.oublier(tenantId);
    return this.lire();
  }

  /** Written encrypted, never read back by a client. */
  async enregistrerFedapay(dto: FedapayDto) {
    const tenantId = tenantCourant();
    await this.secrets.ecrire(
      tenantId,
      CLES_FEDAPAY.cleSecrete,
      dto.cleSecrete,
    );
    await this.secrets.ecrire(
      tenantId,
      CLES_FEDAPAY.secretWebhook,
      dto.secretWebhook,
    );
    await this.secrets.ecrire(
      tenantId,
      CLES_FEDAPAY.environnement,
      dto.environnement,
    );
    return this.lire();
  }

  private async etatFedapay(tenantId: string, slug: string) {
    const lignes = await this.prisma.tenantSecret.findMany({
      where: { tenantId, cle: { in: Object.values(CLES_FEDAPAY) } },
      select: { cle: true, updatedAt: true },
    });
    const propre = lignes.some((l) => l.cle === CLES_FEDAPAY.cleSecrete);
    // CHAP EXPRESS still reads FEDAPAY_* until its keys are entered here.
    const parEnvironnement =
      !propre &&
      tenantId === TENANT_PAR_DEFAUT &&
      Boolean(this.config.get<string>('FEDAPAY_SECRET_KEY'));
    const environnement = propre
      ? await this.secrets.lire(tenantId, CLES_FEDAPAY.environnement)
      : parEnvironnement
        ? (this.config.get<string>('FEDAPAY_ENVIRONMENT') ?? 'sandbox')
        : null;
    return {
      configure: propre || parEnvironnement,
      source: propre ? 'entreprise' : parEnvironnement ? 'environnement' : null,
      environnement:
        environnement === null
          ? null
          : environnement === 'live'
            ? 'live'
            : 'sandbox',
      modifieLe: lignes.reduce<Date | null>(
        (plusRecent, l) =>
          !plusRecent || l.updatedAt > plusRecent ? l.updatedAt : plusRecent,
        null,
      ),
      // To paste in the FedaPay dashboard (webhook of this company).
      cheminWebhook: `/api/paiements/webhook/fedapay/${slug}`,
    };
  }
}

function telephoneOuNull(saisie: string | null | undefined) {
  if (saisie === undefined || saisie === null || saisie.trim() === '') {
    return saisie === undefined ? undefined : null;
  }
  const normalise = normaliserTelephoneBenin(saisie);
  if (!normalise) {
    throw new BadRequestException(
      'Numéro béninois invalide (ex. 01 57 86 69 59).',
    );
  }
  return normalise;
}
