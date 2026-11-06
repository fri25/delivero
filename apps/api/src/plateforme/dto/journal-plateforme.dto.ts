import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class JournalPlateformeDto {
  /** A company id, or "plateforme" for the platform's own events. */
  @IsOptional()
  @IsString()
  entreprise?: string;

  /** Prefix of the action (`securite.`, `POST /api/plateforme`…). */
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsDateString()
  avant?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limite?: number;
}
