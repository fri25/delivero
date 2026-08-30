import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  ModeEmplettes,
  ModeFinancementEmplettes,
  PreferenceRemplacement,
} from '@prisma/client';

export class SaisieManuelleArticleDto {
  @IsString()
  @IsNotEmpty()
  libelle!: string;

  @IsOptional()
  @IsEnum(PreferenceRemplacement)
  preferenceRemplacement?: PreferenceRemplacement;
}

// F-ADM-04 : mêmes champs que CreateCommandeEmplettesDto, `adresseId`
// remplacé par le point de repère brut communiqué au téléphone/WhatsApp.
export class SaisieManuelleEmplettesDto {
  @IsString()
  @IsNotEmpty()
  clientNom!: string;

  @IsString()
  @IsNotEmpty()
  clientTelephone!: string;

  @IsString()
  @IsNotEmpty()
  pointDeRepere!: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsEnum(ModeEmplettes)
  mode!: ModeEmplettes;

  @IsString()
  @IsNotEmpty()
  zoneId!: string;

  @IsOptional()
  @IsString()
  lieuAchat?: string;

  @IsNumber()
  @IsPositive()
  budgetMax!: number;

  @IsEnum(ModeFinancementEmplettes)
  modeFinancement!: ModeFinancementEmplettes;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaisieManuelleArticleDto)
  articles!: SaisieManuelleArticleDto[];
}
