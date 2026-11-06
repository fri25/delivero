import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListerJournalDto {
  /** Prefix of the action (`PATCH /api/admin`, `securite.`…). */
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  acteurId?: string;

  /** Entries strictly older than this date (next page). */
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
