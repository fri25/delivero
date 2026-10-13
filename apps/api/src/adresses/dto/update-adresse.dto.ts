import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateAdresseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  libelle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  adresse?: string;

  /** Priced neighbourhood (GET /quartiers). */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  quartierId?: string;

  /** Name typed by the client; required when quartierId is "Autre quartier". */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  quartier?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  pointDeRepere?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  estParDefaut?: boolean;
}
