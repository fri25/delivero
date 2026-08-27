import { IsNotEmpty, IsString } from 'class-validator';

export class DeclarerLitigeColisDto {
  @IsString()
  @IsNotEmpty()
  motif!: string;
}
