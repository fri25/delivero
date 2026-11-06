import { IsNotEmpty, IsString } from 'class-validator';

export class ConnexionPlateformeDto {
  @IsString()
  @IsNotEmpty()
  telephone!: string;

  @IsString()
  @IsNotEmpty()
  motDePasse!: string;
}
