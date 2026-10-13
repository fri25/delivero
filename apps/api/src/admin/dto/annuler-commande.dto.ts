import { IsString, MaxLength, MinLength } from 'class-validator';

export class AnnulerCommandeDto {
  /** Shown to the client and kept on the order (F-ADM-06). */
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  motif!: string;
}
