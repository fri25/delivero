import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  telephone!: string;

  @IsString()
  @IsNotEmpty()
  motDePasse!: string;
}
