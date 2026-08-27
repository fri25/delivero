import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAdresseDto {
  @IsString()
  @IsNotEmpty()
  libelle!: string;

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
