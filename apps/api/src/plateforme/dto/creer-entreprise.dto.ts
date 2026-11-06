import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { FONCTIONNALITES } from '../plateforme.constantes';

const COULEUR = /^#[0-9a-fA-F]{6}$/;

export class PremierAdminDto {
  @IsString()
  telephone!: string;

  @IsString()
  @MinLength(1)
  nom!: string;

  /** Required for a new number; an existing account keeps its password. */
  @IsOptional()
  @IsString()
  @MinLength(8)
  motDePasse?: string;
}

/**
 * A new company (étape 9). Country, currency, time zone and dialling code
 * are those of Benin: phone checks and prices are Benin-specific today.
 */
export class CreerEntrepriseDto {
  /** Sub-domain label and storage prefix: lowercase, digits, dashes. */
  @Matches(/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/, {
    message: 'Identifiant : 3 à 30 caractères, minuscules, chiffres et tirets.',
  })
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nom!: string;

  /** Name shown in the apps; the legal name by default. */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  nomCommercial?: string;

  @IsString()
  @MinLength(2)
  ville!: string;

  /**
   * Service fee on Repas, in percent: agreed with the company, typed by
   * the platform. No default (CLAUDE.md, garde-fous).
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  tauxCommission!: number;

  @IsOptional()
  @Matches(COULEUR)
  couleurPrimaire?: string;

  @IsArray()
  @ArrayUnique()
  @IsIn(FONCTIONNALITES, { each: true })
  fonctionnalites!: string[];

  @IsString()
  planCode!: string;

  @IsIn(['essai', 'actif'])
  statutAbonnement!: 'essai' | 'actif';

  @ValidateNested()
  @Type(() => PremierAdminDto)
  admin!: PremierAdminDto;
}
