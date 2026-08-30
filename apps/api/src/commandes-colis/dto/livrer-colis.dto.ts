import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

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
}
