import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAdresseDto {
  @IsString()
  @IsNotEmpty()
  libelle!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  adresse?: string;

  /** Priced neighbourhood (GET /quartiers) — mandatory since 13/10 (Q-28). */
  @IsString()
  @IsNotEmpty()
  quartierId!: string;

  /** Name typed by the client; required when quartierId is "Autre quartier". */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  quartier?: string;

  @IsString()
  @IsNotEmpty()
  pointDeRepere!: string;

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
