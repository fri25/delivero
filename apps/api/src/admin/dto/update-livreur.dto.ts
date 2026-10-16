import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateLivreurDto {
  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  plafondAvance?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  plafondCaisse?: number;

  @IsOptional()
  @IsString()
  @MinLength(8)
  motDePasse?: string;
}
