import { ArrayUnique, IsArray, IsIn } from 'class-validator';
import { FONCTIONNALITES } from '../plateforme.constantes';

/** The full list of what the company opens; the others are closed. */
export class FonctionnalitesDto {
  @IsArray()
  @ArrayUnique()
  @IsIn(FONCTIONNALITES, { each: true })
  ouvertes!: string[];
}
