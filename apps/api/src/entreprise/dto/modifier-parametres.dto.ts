import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const COULEUR = /^#[0-9a-fA-F]{6}$/;
const MESSAGE_COULEUR = 'Couleur attendue au format #RRGGBB.';

/**
 * What a company admin changes on its own (étape 8). Not here: country,
 * currency, time zone and dialling code (phone checks are Benin-specific)
 * and the opened features, both set by the platform (étape 9).
 * null clears an optional field.
 */
export class ModifierParametresDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  nomCommercial?: string;

  @IsOptional()
  @ValidateIf((_, valeur) => valeur !== null)
  @IsUrl({ protocols: ['https'], require_protocol: true })
  logoUrl?: string | null;

  @IsOptional()
  @Matches(COULEUR, { message: MESSAGE_COULEUR })
  couleurPrimaire?: string;

  @IsOptional()
  @Matches(COULEUR, { message: MESSAGE_COULEUR })
  couleurMarine?: string;

  @IsOptional()
  @Matches(COULEUR, { message: MESSAGE_COULEUR })
  couleurSignal?: string;

  @IsOptional()
  @ValidateIf((_, valeur) => valeur !== null)
  @IsString()
  telephoneContact?: string | null;

  @IsOptional()
  @ValidateIf((_, valeur) => valeur !== null)
  @IsString()
  whatsappSupport?: string | null;

  @IsOptional()
  @ValidateIf((_, valeur) => valeur !== null)
  @IsEmail()
  emailContact?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  ville?: string;

  /**
   * Service fee on Repas, in percent. The company decides its own value;
   * nothing is suggested here (CLAUDE.md, garde-fous). Applies to orders
   * placed after the change.
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  tauxCommission?: number;
}
