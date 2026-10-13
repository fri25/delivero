import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateQuartierDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nom!: string;

  /** FCFA. Values in use on 13/10: 500 (centre) and 1 000 (further out). */
  @IsNumber()
  @Min(0)
  fraisLivraison!: number;
}
