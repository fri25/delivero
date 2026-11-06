import {
  BadRequestException,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ParametresTenantService } from './parametres-tenant.service';

const APPLICATIONS: Record<string, (nom: string) => string> = {
  client: (nom) => nom,
  livreur: (nom) => `${nom} Livreur`,
  partenaires: (nom) => `${nom} Partenaires`,
  admin: (nom) => `${nom} Admin`,
};

const echapper = (texte: string) =>
  texte.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Installed name and icon of the PWAs for a company other than CHAP
 * EXPRESS (étape 10 of docs/plan-migration-multi-tenant.md). CHAP EXPRESS
 * keeps the manifest built with each app: its installed PWAs do not change.
 * Public and outside any company context (TenantMiddleware): the browser
 * fetches the manifest without the app's headers, the slug names the
 * company. Nothing confidential: name, colours, logo.
 */
@Controller('tenant/:slug')
@Public()
export class ManifesteController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parametres: ParametresTenantService,
  ) {}

  @Get('manifeste/:application')
  @Header('Content-Type', 'application/manifest+json; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  async manifeste(
    @Param('slug') slug: string,
    @Param('application') application: string,
    @Query('origine') origine?: string,
  ) {
    const nommer = APPLICATIONS[application];
    if (!nommer) throw new NotFoundException('Application inconnue.');
    const base = origineValide(origine);
    const { id, nomCommercial, identite } = await this.entreprise(slug);
    const nom = nommer(nomCommercial);
    return {
      lang: 'fr',
      // Stable per company and app, whatever its domain becomes.
      id: `/?pwa=${encodeURIComponent(`${id}-${application}`)}`,
      name: nom,
      short_name: nom.length > 12 ? nomCommercial : nom,
      description:
        application === 'client'
          ? `Livraison à ${identite.ville}`
          : `${nom} — ${identite.ville}`,
      theme_color: identite.couleurMarine,
      background_color: '#f6f8fc',
      display: 'standalone',
      start_url: base ? `${base}/` : '/',
      scope: base ? `${base}/` : '/',
      icons: [
        ...(identite.logoUrl
          ? [{ src: identite.logoUrl, sizes: 'any', purpose: 'any' }]
          : []),
        {
          // Relative to the manifest's URL: this API.
          src: '../icone.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any maskable',
        },
      ],
    };
  }

  /** Initial of the company on its colour, safe area kept for "maskable". */
  @Get('icone.svg')
  @Header('Content-Type', 'image/svg+xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  async icone(@Param('slug') slug: string) {
    const { nomCommercial, identite } = await this.entreprise(slug);
    const initiale = echapper(
      (nomCommercial.trim()[0] ?? '?').toLocaleUpperCase('fr'),
    );
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${echapper(identite.couleurMarine)}"/><circle cx="256" cy="256" r="150" fill="${echapper(identite.couleurPrimaire)}"/><text x="256" y="256" dy="0.35em" text-anchor="middle" font-family="system-ui, sans-serif" font-size="180" font-weight="800" fill="#ffffff">${initiale}</text></svg>`;
  }

  private async entreprise(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!tenant) throw new NotFoundException('Entreprise inconnue.');
    return { id: tenant.id, ...(await this.parametres.pour(tenant.id)) };
  }
}

/** `https://livraison.exemple.bj`, or null; anything else is refused. */
function origineValide(origine: string | undefined): string | null {
  if (!origine) return null;
  try {
    const url = new URL(origine);
    if (url.protocol !== 'https:' && url.protocol !== 'http:')
      throw new Error();
    return url.origin;
  } catch {
    throw new BadRequestException('Origine invalide.');
  }
}
