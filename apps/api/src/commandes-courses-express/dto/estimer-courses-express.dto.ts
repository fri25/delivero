import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class EstimerCoursesExpressDto {
  @IsString()
  @IsNotEmpty()
  zoneId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  nombreEtapes!: number;
}
