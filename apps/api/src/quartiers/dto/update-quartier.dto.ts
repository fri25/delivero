import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateQuartierDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nom?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fraisLivraison?: number;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
