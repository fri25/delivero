import { IsNotEmpty, IsString } from 'class-validator';

/** The price only depends on the delivery neighbourhood (Q-28, 13/10). */
export class EstimerColisDto {
  @IsString()
  @IsNotEmpty()
  quartierLivraisonId!: string;
}
