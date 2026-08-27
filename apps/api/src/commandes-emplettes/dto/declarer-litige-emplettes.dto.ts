import { IsNotEmpty, IsString } from 'class-validator';

export class DeclarerLitigeEmplettesDto {
  @IsString()
  @IsNotEmpty()
  motif!: string;
}
