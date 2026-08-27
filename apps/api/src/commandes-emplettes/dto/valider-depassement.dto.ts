import { IsBoolean } from 'class-validator';

export class ValiderDepassementDto {
  @IsBoolean()
  accepter!: boolean;
}
