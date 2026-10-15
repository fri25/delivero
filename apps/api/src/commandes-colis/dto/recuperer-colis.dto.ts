import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class RecupererColisDto {
  /**
   * F-LIV-06: Cloudinary URL of the parcel photo taken by the livreur at pickup.
   * Upload signed with usage 'colis' (validated by assertUrlsAutorisees).
   */
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  photoEnlevementUrl?: string;

  /**
   * F-LIV-06: Visual check status or remarks upon pickup
   * (e.g. "Emballage conforme & intact", "Légère détérioration", etc.).
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  etatEnlevement?: string;
}
