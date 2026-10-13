import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePartenaireDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nom?: string;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  pointDeRepere?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  adresse?: string;

  /** New password, when the restaurant has lost its own. */
  @IsOptional()
  @IsString()
  @MinLength(8)
  motDePasse?: string;
}
