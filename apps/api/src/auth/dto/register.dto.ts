import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  telephone!: string;

  @IsString()
  @MinLength(8)
  motDePasse!: string;

  @IsString()
  @IsNotEmpty()
  nom!: string;
}
