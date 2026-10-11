import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { SignerMediaDto } from './dto/signer-media.dto';
import { MediasService } from './medias.service';

@Controller('medias')
export class MediasController {
  constructor(private readonly mediasService: MediasService) {}

  // Lets the forms hide the photo field when uploads are not configured.
  @Public()
  @Get('config')
  config() {
    return this.mediasService.configPublique();
  }

  // Public because guests (F-CLI-02) attach photos too. Each signature only
  // allows images in a fixed folder; the throttle bounds quota abuse.
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('signature')
  @HttpCode(200)
  signer(@Body() dto: SignerMediaDto) {
    return this.mediasService.signer(dto.usage);
  }
}
