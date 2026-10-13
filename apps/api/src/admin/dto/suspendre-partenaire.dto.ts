import { IsBoolean } from 'class-validator';

export class SuspendrePartenaireDto {
  @IsBoolean()
  suspendu!: boolean;
}
