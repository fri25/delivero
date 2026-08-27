import {
  Equals,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { ModePaiement, TailleColis } from '@prisma/client';

export class CreateCommandeColisDto {
  @IsString()
  @IsNotEmpty()
  adresseEnlevementId!: string;

  @IsString()
  @IsNotEmpty()
  zoneId!: string;

  @IsEnum(TailleColis)
  taille!: TailleColis;

  @IsString()
  @IsNotEmpty()
  destinataireNom!: string;

  @IsString()
  @IsNotEmpty()
  destinataireTelephone!: string;

  @IsString()
  @IsNotEmpty()
  adresseLivraison!: string;

  @IsString()
  @IsNotEmpty()
  pointDeRepereLivraison!: string;

  @IsOptional()
  @IsNumber()
  latitudeLivraison?: number;

  @IsOptional()
  @IsNumber()
  longitudeLivraison?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valeurDeclaree?: number;

  @IsOptional()
  @IsBoolean()
  fragile?: boolean;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  montantContreRemboursement?: number;

  @IsEnum(ModePaiement)
  modePaiement!: ModePaiement;

  // Absent = enlèvement immédiat. Présent = créneau planifié (doit être dans
  // le futur, vérifié côté service).
  @IsOptional()
  @IsDateString()
  programmationAt?: string;

  // Rappel des objets interdits au transport (RG-16) : acceptation
  // obligatoire, pas de valeur par défaut à true.
  @Equals(true, {
    message: 'L’acceptation des conditions (objets interdits) est obligatoire.',
  })
  conditionsAcceptees!: boolean;
}
