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
  IsUrl,
  MaxLength,
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

  /** Kept for the livreur (what to carry); no longer changes the price. */
  @IsEnum(TailleColis)
  taille!: TailleColis;

  /** F-CLI-16: Description or nature of the parcel (e.g. documents, clothes...). */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nature?: string;

  /** Recipient's neighbourhood (GET /quartiers): sets the price (Q-28, 13/10). */
  @IsString()
  @IsNotEmpty()
  quartierLivraisonId!: string;

  /** Name typed for "Autre quartier". */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  quartierLivraison?: string;

  @IsString()
  @IsNotEmpty()
  destinataireNom!: string;

  @IsString()
  @IsNotEmpty()
  destinataireTelephone!: string;

  /** Street, house… — optional: neighbourhood + landmark locate the recipient. */
  @IsOptional()
  @IsString()
  @MaxLength(180)
  adresseLivraison?: string;

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

  /** Cloudinary URL from POST /medias/signature + direct upload. */
  @IsOptional()
  @IsUrl({ protocols: ['https'] })
  @MaxLength(500)
  photoUrl?: string;

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
