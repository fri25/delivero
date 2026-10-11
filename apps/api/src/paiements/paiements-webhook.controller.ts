import {
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { PaiementsService } from './paiements.service';

// Called by FedaPay, not by a user: authenticated by the HMAC signature only.
// URL to declare in the FedaPay dashboard: <api>/api/paiements/webhook/fedapay
@Controller('paiements/webhook')
export class PaiementsWebhookController {
  constructor(private readonly paiementsService: PaiementsService) {}

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
    );
  }
}
