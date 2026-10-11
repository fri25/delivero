import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TYPES_CUISINE } from '../types-cuisine';

export class UpdateRestaurantDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nom?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  specialiteCuisine?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(180)
  delaiMoyenMinutes?: number;

  @IsOptional()
  @IsString()
  horaires?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  pointDeRepere?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(TYPES_CUISINE, { each: true })
  typesCuisine?: string[];

  /** Average preparation time, in minutes (catalogue "délai" filter). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(240)
  delaiPreparationMin?: number;
}
