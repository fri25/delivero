import { IsNotEmpty, IsString } from 'class-validator';

export class DeclarerLitigeCoursesExpressDto {
  @IsString()
  @IsNotEmpty()
  motif!: string;
}
