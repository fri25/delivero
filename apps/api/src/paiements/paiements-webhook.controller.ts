import {
  Controller,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { TENANT_PAR_DEFAUT } from '../auth/appartenance';
import { PrismaService } from '../prisma/prisma.service';
import { PaiementsService } from './paiements.service';

// Called by FedaPay, not by a user: authenticated by the HMAC signature only.
// URL to declare in each company's FedaPay dashboard (étape 5):
// <api>/api/paiements/webhook/fedapay/<slug>. The URL without slug stays
// CHAP EXPRESS's until its dashboard is updated.
@Controller('paiements/webhook')
export class PaiementsWebhookController {
  constructor(
    private readonly paiementsService: PaiementsService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @SkipThrottle()
  @Post('fedapay')
  @HttpCode(200)
  fedapay(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-fedapay-signature') signature?: string,
  ) {
    // The signature covers the exact bytes sent: needs `rawBody: true` in
    // main.ts, re-serialising req.body would not match.
    return this.paiementsService.traiterWebhook(
      req.rawBody?.toString('utf8'),
      signature,
      TENANT_PAR_DEFAUT,
    );
  }

  @Public()
  @SkipThrottle()
  @Post('fedapay/:slug')
  @HttpCode(200)
  async fedapayEntreprise(
    @Param('slug') slug: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-fedapay-signature') signature?: string,
  ) {
    // tenants is a platform table: no company context needed.
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!tenant) {
      throw new NotFoundException('Entreprise inconnue.');
    }
    return this.paiementsService.traiterWebhook(
      req.rawBody?.toString('utf8'),
      signature,
      tenant.id,
    );
  }
}
