import { IsNumber, Min } from 'class-validator';

export class ClotureCaisseDto {
  @IsNumber()
  @Min(0)
  montantDeclare!: number;
}
