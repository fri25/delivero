import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class RembourserDto {
  /** May be below the amount paid (then `motif` is required), or 0. */
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @Max(10_000_000)
  montantRembourse!: number;

  /** Mobile Money transfer reference; required when something is sent. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  motif?: string;
}
