import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class DemanderOtpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  telephone!: string;
}

export class VerifierOtpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  telephone!: string;

  @Matches(/^\d{6}$/, { message: 'Le code comporte 6 chiffres.' })
  code!: string;

  /** Required only when the number has no account yet (sign-up by OTP). */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom?: string;
}
