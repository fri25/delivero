import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateAvisDto {
  @IsIn(['partenaire', 'livreur'])
  cible!: 'partenaire' | 'livreur';

  @IsInt()
  @Min(1)
  @Max(5)
  note!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  commentaire?: string;
}
