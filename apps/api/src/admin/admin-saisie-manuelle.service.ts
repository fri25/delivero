import { Injectable } from '@nestjs/common';
import { CommandesColisService } from '../commandes-colis/commandes-colis.service';
import { CommandesCoursesExpressService } from '../commandes-courses-express/commandes-courses-express.service';
import { CommandesEmplettesService } from '../commandes-emplettes/commandes-emplettes.service';
import { CommandesRepasService } from '../commandes-repas/commandes-repas.service';
import { PrismaService } from '../prisma/prisma.service';
import { SaisieManuelleColisDto } from './dto/saisie-manuelle-colis.dto';
import { SaisieManuelleCoursesExpressDto } from './dto/saisie-manuelle-courses-express.dto';
import { SaisieManuelleEmplettesDto } from './dto/saisie-manuelle-emplettes.dto';
import { SaisieManuelleRepasDto } from './dto/saisie-manuelle-repas.dto';

const CLIENT_ROLE_NAME = 'client';

// F-ADM-04 : une demande reçue par téléphone/WhatsApp n'a ni compte client
// ni adresse en carnet (le mode invité F-CLI-02 n'est pas construit). Plutôt
// que dupliquer la tarification et les validations des 4 services, on
// résout (ou crée) un compte client "coquille" par numéro de téléphone —
// sans mot de passe, jamais destiné à une connexion directe — puis on
// délègue au create() déjà utilisé par le parcours client normal. Limite
// assumée : si cette personne s'inscrit plus tard normalement, son numéro
// est déjà pris ; aucune fusion de compte n'est prévue.
@Injectable()
export class AdminSaisieManuelleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commandesRepas: CommandesRepasService,
    private readonly commandesColis: CommandesColisService,
    private readonly commandesEmplettes: CommandesEmplettesService,
    private readonly commandesCoursesExpress: CommandesCoursesExpressService,
  ) {}

  private async resoudreClient(
    telephone: string,
    nom: string,
  ): Promise<string> {
    const clientRole = await this.prisma.role.findUniqueOrThrow({
      where: { name: CLIENT_ROLE_NAME },
    });
    const user = await this.prisma.user.upsert({
      where: { telephone },
      update: {},
      create: { telephone, nom, roleId: clientRole.id },
    });
    return user.id;
  }

  private creerAdresse(
    userId: string,
    pointDeRepere: string,
    latitude?: number,
    longitude?: number,
  ) {
    return this.prisma.adresse.create({
      data: {
        userId,
        libelle: 'Saisie manuelle (téléphone/WhatsApp)',
        pointDeRepere,
        latitude,
        longitude,
      },
    });
  }

  async saisirRepas(dto: SaisieManuelleRepasDto) {
    const clientId = await this.resoudreClient(
      dto.clientTelephone,
      dto.clientNom,
    );
    const adresse = await this.creerAdresse(
      clientId,
      dto.pointDeRepere,
      dto.latitude,
      dto.longitude,
    );
    return this.commandesRepas.create(clientId, {
      partenaireId: dto.partenaireId,
      adresseId: adresse.id,
      modePaiement: dto.modePaiement,
      lignes: dto.lignes,
    });
  }

  async saisirColis(dto: SaisieManuelleColisDto) {
    const clientId = await this.resoudreClient(
      dto.clientTelephone,
      dto.clientNom,
    );
    const adresseEnlevement = await this.creerAdresse(
      clientId,
      dto.pointDeRepereEnlevement,
      dto.latitudeEnlevement,
      dto.longitudeEnlevement,
    );
    return this.commandesColis.create(clientId, {
      adresseEnlevementId: adresseEnlevement.id,
      zoneId: dto.zoneId,
      taille: dto.taille,
      destinataireNom: dto.destinataireNom,
      destinataireTelephone: dto.destinataireTelephone,
      adresseLivraison: dto.adresseLivraison,
      pointDeRepereLivraison: dto.pointDeRepereLivraison,
      latitudeLivraison: dto.latitudeLivraison,
      longitudeLivraison: dto.longitudeLivraison,
      valeurDeclaree: dto.valeurDeclaree,
      fragile: dto.fragile,
      montantContreRemboursement: dto.montantContreRemboursement,
      modePaiement: dto.modePaiement,
      programmationAt: dto.programmationAt,
      conditionsAcceptees: dto.conditionsAcceptees,
    });
  }

  async saisirEmplettes(dto: SaisieManuelleEmplettesDto) {
    const clientId = await this.resoudreClient(
      dto.clientTelephone,
      dto.clientNom,
    );
    const adresse = await this.creerAdresse(
      clientId,
      dto.pointDeRepere,
      dto.latitude,
      dto.longitude,
    );
    return this.commandesEmplettes.create(clientId, {
      mode: dto.mode,
      zoneId: dto.zoneId,
      adresseId: adresse.id,
      lieuAchat: dto.lieuAchat,
      budgetMax: dto.budgetMax,
      modeFinancement: dto.modeFinancement,
      articles: dto.articles,
    });
  }

  async saisirCoursesExpress(dto: SaisieManuelleCoursesExpressDto) {
    const clientId = await this.resoudreClient(
      dto.clientTelephone,
      dto.clientNom,
    );
    return this.commandesCoursesExpress.create(clientId, {
      description: dto.description,
      zoneId: dto.zoneId,
      modePaiement: dto.modePaiement,
      etapes: dto.etapes,
    });
  }
}
