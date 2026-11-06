import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

/** Managed by hand, no billing (decision Q-MT-5). */
export class AbonnementDto {
  @IsString()
  planCode!: string;

  @IsIn(['essai', 'actif', 'suspendu', 'termine'])
  statut!: 'essai' | 'actif' | 'suspendu' | 'termine';

  @IsOptional()
  @ValidateIf((_, valeur) => valeur !== null)
  @IsDateString()
  finAt?: string | null;
}
