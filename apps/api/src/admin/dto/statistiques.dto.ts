import { IsIn, IsOptional } from 'class-validator';
import type { Periode } from '../statistiques';

export class StatistiquesDto {
  @IsOptional()
  @IsIn(['jour', '7j', '30j'])
  periode?: Periode;
}
