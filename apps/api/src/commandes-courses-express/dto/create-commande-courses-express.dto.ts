import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
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

  /** Up to 3 Cloudinary URLs (POST /medias/signature + direct upload). */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsUrl({ protocols: ['https'] }, { each: true })
  @MaxLength(500, { each: true })
  photoUrls?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateEtapeDto)
  etapes!: CreateEtapeDto[];
}
