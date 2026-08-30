import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ModePaiement } from '@prisma/client';

export class SaisieManuelleEtapeDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  pointDeRepere!: string;

  @IsOptional()
  @IsString()
  adresse?: string;
}

// F-ADM-04 : identique à CreateCommandeCoursesExpressDto — ce service n'a
// jamais dépendu du carnet d'adresses du client (étapes en texte libre),
// seule l'identité de l'appelant s'ajoute.
export class SaisieManuelleCoursesExpressDto {
  @IsString()
  @IsNotEmpty()
  clientNom!: string;

  @IsString()
  @IsNotEmpty()
  clientTelephone!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  zoneId!: string;

  @IsEnum(ModePaiement)
  modePaiement!: ModePaiement;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaisieManuelleEtapeDto)
  etapes!: SaisieManuelleEtapeDto[];
}
