import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

// V01 : le code de remise est désormais obligatoire (RG-07 imposé, pas
// seulement recommandé) — nomReceptionnaire reste une information
// complémentaire, mais ne peut plus remplacer l'OTP à lui seul.
export class LivrerColisDto {
  @IsString()
  codeOtp!: string;

  @IsOptional()
  @IsString()
  nomReceptionnaire?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  montantEncaisse?: number;

  /** F-CLI-22: Cloudinary URL of delivery proof photo. */
  @IsOptional()
  @IsUrl({ protocols: ['https'] })
  @MaxLength(500)
  photoPreuveUrl?: string;
}
