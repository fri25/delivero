import { IsOptional, IsString } from 'class-validator';

// livreurId omis => attribution automatique par rotation (F-ADM-02).
// livreurId fourni => réattribution manuelle (F-ADM-03), qui contourne
// volontairement la zone et les plafonds (le dispatcher est de confiance,
// contrairement à l'algorithme automatique qui doit les respecter).
export class AttribuerCommandeDto {
  @IsOptional()
  @IsString()
  livreurId?: string;
}
