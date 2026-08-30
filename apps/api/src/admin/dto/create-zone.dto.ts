import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

// Les 3 tarifs sont exigés ensemble : une zone sans grille Colis/Courses
// express casserait leur estimation (calculerTarif lève NotFoundException si
// la grille manque, voir commandes-colis.service.ts).
export class CreateZoneDto {
  @IsString()
  @MinLength(1)
  nom!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsPositive()
  fraisLivraison!: number;

  @IsNumber()
  @IsPositive()
  tarifBaseColis!: number;

  @IsNumber()
  @IsPositive()
  tarifBaseCoursesExpress!: number;
}
