import { IsString, MaxLength, MinLength } from 'class-validator';

export class PaiementRecuDto {
  /** Mobile Money operator's transaction reference (F-ADM-04). */
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  reference!: string;
}
