import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ModePaiement } from '@prisma/client';

export class SaisieManuelleLigneDto {
  @IsString()
  @IsNotEmpty()
  platId!: string;

  @IsInt()
  @Min(1)
  quantite!: number;

  @IsOptional()
  @IsString()
  instructions?: string;
}

// F-ADM-04 : mêmes champs que CreateCommandeRepasDto, mais `adresseId`
// (carnet du client) est remplacé par le point de repère brut communiqué au
// téléphone/WhatsApp — voir AdminSaisieManuelleService pour la résolution
// du compte client et la création de l'adresse.
export class SaisieManuelleRepasDto {
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

  @IsString()
  @IsNotEmpty()
  partenaireId!: string;

  @IsEnum(ModePaiement)
  modePaiement!: ModePaiement;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaisieManuelleLigneDto)
  lignes!: SaisieManuelleLigneDto[];
}
