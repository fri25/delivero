import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ModePaiement } from '@prisma/client';

export class CreateLigneCommandeRepasDto {
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

export class CreateCommandeRepasDto {
  @IsString()
  @IsNotEmpty()
  partenaireId!: string;

  @IsString()
  @IsNotEmpty()
  adresseId!: string;

  @IsEnum(ModePaiement)
  modePaiement!: ModePaiement;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLigneCommandeRepasDto)
  lignes!: CreateLigneCommandeRepasDto[];
}
