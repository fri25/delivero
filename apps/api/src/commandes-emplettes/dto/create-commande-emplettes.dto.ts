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

export class CreateArticleEmpletteDto {
  @IsString()
  @IsNotEmpty()
  libelle!: string;

  @IsOptional()
  @IsEnum(PreferenceRemplacement)
  preferenceRemplacement?: PreferenceRemplacement;
}

export class CreateCommandeEmplettesDto {
  // Les deux valeurs sont acceptées par la validation pour renvoyer un
  // message explicite si `catalogue` est demandé (voir le service), plutôt
  // qu'un rejet générique de class-validator.
  @IsEnum(ModeEmplettes)
  mode!: ModeEmplettes;

  @IsString()
  @IsNotEmpty()
  zoneId!: string;

  @IsString()
  @IsNotEmpty()
  adresseId!: string;

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
  @Type(() => CreateArticleEmpletteDto)
  articles!: CreateArticleEmpletteDto[];
}
