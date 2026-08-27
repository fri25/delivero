import { IsNotEmpty, IsString } from 'class-validator';

export class TerminerAchatsDto {
  @IsString()
  @IsNotEmpty()
  recapitulatifAchats!: string;
}
