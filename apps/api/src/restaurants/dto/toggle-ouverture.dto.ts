import { IsBoolean } from 'class-validator';

export class ToggleOuvertureDto {
  @IsBoolean()
  statutOuverture!: boolean;
}
