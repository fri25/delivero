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

export class CreateEtapeDto {
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

export class CreateCommandeCoursesExpressDto {
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
  @Type(() => CreateEtapeDto)
  etapes!: CreateEtapeDto[];
}
