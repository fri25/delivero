import { IsNotEmpty, IsString } from 'class-validator';

export class RefuserCommandeDto {
  @IsString()
  @IsNotEmpty()
  motif!: string;
}
