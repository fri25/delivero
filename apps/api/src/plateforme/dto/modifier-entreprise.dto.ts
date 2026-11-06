import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ModifierEntrepriseDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nom?: string;

  /** suspendu: every request of the company is refused (sign-in included). */
  @IsOptional()
  @IsIn(['actif', 'suspendu'])
  statut?: 'actif' | 'suspendu';
}
