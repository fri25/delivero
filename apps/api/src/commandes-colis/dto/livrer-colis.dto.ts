import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

// Au moins un de codeOtp / nomReceptionnaire est exigé (RG-07, "et/ou") —
// vérifié dans le service plutôt que dans le DTO, car la règle porte sur la
// combinaison des deux champs.
export class LivrerColisDto {
  @IsOptional()
  @IsString()
  codeOtp?: string;

  @IsOptional()
  @IsString()
  nomReceptionnaire?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  montantEncaisse?: number;
}
