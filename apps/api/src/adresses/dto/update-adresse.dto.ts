import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateAdresseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  libelle?: string;

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
