import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

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
}
