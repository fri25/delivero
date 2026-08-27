import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class EstimerEmplettesDto {
  @IsString()
  @IsNotEmpty()
  zoneId!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  budgetMax!: number;
}
