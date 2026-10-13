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
  MaxLength,
  Min,
} from 'class-validator';
import { ModePaiement, TailleColis } from '@prisma/client';

// F-ADM-04 : mêmes champs que CreateCommandeColisDto, `adresseEnlevementId`
// remplacé par le point de repère d'enlèvement brut (l'adresse de livraison
// était déjà en texte libre, pas de changement là-dessus).
export class SaisieManuelleColisDto {
  @IsString()
  @IsNotEmpty()
  clientNom!: string;

  @IsString()
  @IsNotEmpty()
  clientTelephone!: string;

  @IsString()
  @IsNotEmpty()
  pointDeRepereEnlevement!: string;

  @IsOptional()
  @IsNumber()
  latitudeEnlevement?: number;

  @IsOptional()
  @IsNumber()
  longitudeEnlevement?: number;

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
  @IsOptional()
  adresseLivraison?: string;

  /** Recipient's neighbourhood: sets the price (Q-28, 13/10). */
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

  @IsOptional()
  @IsDateString()
  programmationAt?: string;

  @Equals(true, {
    message: 'L’acceptation des conditions (objets interdits) est obligatoire.',
  })
  conditionsAcceptees!: boolean;
}
