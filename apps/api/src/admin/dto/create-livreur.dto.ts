import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateLivreurDto {
  @IsString()
  @IsNotEmpty()
  telephone!: string;

  @IsString()
  @MinLength(8)
  motDePasse!: string;

  @IsString()
  @MinLength(1)
  nom!: string;

  @IsString()
  zoneId!: string;

  @IsNumber()
  @IsPositive()
  plafondAvance!: number;

  @IsNumber()
  @IsPositive()
  plafondCaisse!: number;
}
