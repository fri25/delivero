import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { StatutArticleEmplette } from '@prisma/client';

type StatutPointage = Exclude<StatutArticleEmplette, 'en_attente'>;
const STATUTS_POINTAGE: StatutPointage[] = [
  'achete',
  'indisponible',
  'remplace',
];

// `en_attente` exclu : ce DTO ne sert qu'à pointer un article (le remettre en
// attente n'a pas de sens métier dans cette itération). @IsIn plutôt que
// @IsEnum pour exclure réellement cette valeur à l'exécution, pas seulement
// au typage.
export class PointerArticleDto {
  @IsIn(STATUTS_POINTAGE)
  statut!: StatutPointage;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  prixReel?: number;

  @IsOptional()
  @IsString()
  produitRemplacementLibelle?: string;
}
