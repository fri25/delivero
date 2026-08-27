import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TailleColis } from '@prisma/client';

export class EstimerColisDto {
  @IsString()
  @IsNotEmpty()
  zoneId!: string;

  @IsEnum(TailleColis)
  taille!: TailleColis;
}
