import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

/**
 * One neighbourhood id per stop, in order: `?quartierIds=a,b` (Q-28, 13/10 —
 * the dearest neighbourhood × the number of stops).
 */
export class EstimerCoursesExpressDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',').filter(Boolean) : value,
  )
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  quartierIds!: string[];
}
