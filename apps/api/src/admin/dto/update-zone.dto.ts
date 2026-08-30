import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateZoneDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  fraisLivraison?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  tarifBaseColis?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  tarifBaseCoursesExpress?: number;
}
