import { OmitType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateCommandeColisDto } from '../../commandes-colis/dto/create-commande-colis.dto';
import { CreateCommandeCoursesExpressDto } from '../../commandes-courses-express/dto/create-commande-courses-express.dto';
import { CreateCommandeRepasDto } from '../../commandes-repas/dto/create-commande-repas.dto';

export class ContactInviteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom!: string;

  /** Normalised server-side (auth/telephone.ts); must be a Benin number. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  telephone!: string;
}

/**
 * Guest address, entered inline (no address book). Same local rule as
 * everywhere: the landmark is mandatory, GPS is only a complement.
 */
export class AdresseInviteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  pointDeRepere!: string;

  /** Priced neighbourhood (GET /quartiers) — Q-28, 13/10. */
  @IsString()
  @IsNotEmpty()
  quartierId!: string;

  /** Name typed for "Autre quartier". */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  quartier?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}

export class CreateCommandeRepasInviteDto extends OmitType(
  CreateCommandeRepasDto,
  ['adresseId'] as const,
) {
  @ValidateNested()
  @Type(() => ContactInviteDto)
  invite!: ContactInviteDto;

  @ValidateNested()
  @Type(() => AdresseInviteDto)
  adresse!: AdresseInviteDto;
}

export class CreateCommandeColisInviteDto extends OmitType(
  CreateCommandeColisDto,
  ['adresseEnlevementId'] as const,
) {
  @ValidateNested()
  @Type(() => ContactInviteDto)
  invite!: ContactInviteDto;

  /** Pick-up address (the guest is the sender). */
  @ValidateNested()
  @Type(() => AdresseInviteDto)
  adresseEnlevement!: AdresseInviteDto;
}

export class CreateCommandeCoursesExpressInviteDto extends CreateCommandeCoursesExpressDto {
  @ValidateNested()
  @Type(() => ContactInviteDto)
  invite!: ContactInviteDto;
}
