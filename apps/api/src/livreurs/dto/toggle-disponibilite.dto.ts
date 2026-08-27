import { IsBoolean } from 'class-validator';

export class ToggleDisponibiliteDto {
  @IsBoolean()
  disponible!: boolean;
}
