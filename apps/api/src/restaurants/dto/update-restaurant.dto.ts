import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

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
}
