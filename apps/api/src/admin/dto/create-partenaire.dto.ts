import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// F-ADM-08: a restaurant and its sign-in account, created in one go.
export class CreatePartenaireDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nom!: string;

  /** Sign-in phone number of the restaurant's account. */
  @IsString()
  @IsNotEmpty()
  telephone!: string;

  @IsString()
  @MinLength(8)
  motDePasse!: string;

  @IsString()
  zoneId!: string;

  /** Required: the livreur must find the restaurant without a map. */
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  pointDeRepere!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  adresse?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
