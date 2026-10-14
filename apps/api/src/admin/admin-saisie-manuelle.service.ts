import { Injectable } from '@nestjs/common';
import { CommandesColisService } from '../commandes-colis/commandes-colis.service';
import { CommandesCoursesExpressService } from '../commandes-courses-express/commandes-courses-express.service';
import { CommandesEmplettesService } from '../commandes-emplettes/commandes-emplettes.service';
import { CommandesRepasService } from '../commandes-repas/commandes-repas.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuartiersService } from '../quartiers/quartiers.service';
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
//
// Paiement (décision du 13/10) : le client envoie le Mobile Money au numéro
// ChapExpress et le dispatcher confirme la réception (PaiementsService
// .confirmerManuellement). La commande est marquée `saisieParId` : c'est ce
// qui autorise cette confirmation à la main.
@Injectable()
export class AdminSaisieManuelleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commandesRepas: CommandesRepasService,
    private readonly commandesColis: CommandesColisService,
    private readonly commandesEmplettes: CommandesEmplettesService,
    private readonly commandesCoursesExpress: CommandesCoursesExpressService,
    private readonly quartiers: QuartiersService,
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

  // `quartier` is mandatory where it prices the order (Repas delivery);
  // optional for a Colis pick-up point, which does not change the price.
  private async creerAdresse(
    userId: string,
    pointDeRepere: string,
    latitude?: number,
    longitude?: number,
    quartier?: { id: string; precision?: string },
  ) {
    const resolu = quartier
      ? await this.quartiers.resoudre(quartier.id, quartier.precision)
      : undefined;
    return this.prisma.adresse.create({
      data: {
        userId,
        libelle: 'Saisie manuelle (téléphone/WhatsApp)',
        pointDeRepere,
        latitude,
        longitude,
        quartierId: resolu?.quartier.id,
        quartier: resolu?.nom,
      },
    });
  }

  // The order services own their creation transaction; the dispatcher who
  // entered it is recorded right after.
  private async marquerSaisie<T extends { commandeId: string }>(
    adminId: string,
    creation: Promise<T>,
  ): Promise<T> {
    const cree = await creation;
    await this.prisma.commande.update({
      where: { id: cree.commandeId },
      data: { saisieParId: adminId },
    });
    return cree;
  }

  async saisirRepas(dto: SaisieManuelleRepasDto, adminId: string) {
    const clientId = await this.resoudreClient(
      dto.clientTelephone,
      dto.clientNom,
    );
    const adresse = await this.creerAdresse(
      clientId,
      dto.pointDeRepere,
      dto.latitude,
      dto.longitude,
      { id: dto.quartierId, precision: dto.quartier },
    );
    return this.marquerSaisie(
      adminId,
      this.commandesRepas.create(clientId, {
        partenaireId: dto.partenaireId,
        adresseId: adresse.id,
        modePaiement: dto.modePaiement,
        lignes: dto.lignes,
      }),
    );
  }

  async saisirColis(dto: SaisieManuelleColisDto, adminId: string) {
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
    return this.marquerSaisie(
      adminId,
      this.commandesColis.create(clientId, {
        adresseEnlevementId: adresseEnlevement.id,
        zoneId: dto.zoneId,
        taille: dto.taille,
        destinataireNom: dto.destinataireNom,
        destinataireTelephone: dto.destinataireTelephone,
        adresseLivraison: dto.adresseLivraison,
        quartierLivraisonId: dto.quartierLivraisonId,
        quartierLivraison: dto.quartierLivraison,
        pointDeRepereLivraison: dto.pointDeRepereLivraison,
        latitudeLivraison: dto.latitudeLivraison,
        longitudeLivraison: dto.longitudeLivraison,
        valeurDeclaree: dto.valeurDeclaree,
        fragile: dto.fragile,
        montantContreRemboursement: dto.montantContreRemboursement,
        modePaiement: dto.modePaiement,
        programmationAt: dto.programmationAt,
        conditionsAcceptees: dto.conditionsAcceptees,
      }),
    );
  }

  async saisirEmplettes(dto: SaisieManuelleEmplettesDto, adminId: string) {
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
    return this.marquerSaisie(
      adminId,
      this.commandesEmplettes.create(clientId, {
        mode: dto.mode,
        zoneId: dto.zoneId,
        adresseId: adresse.id,
        lieuAchat: dto.lieuAchat,
        budgetMax: dto.budgetMax,
        modeFinancement: dto.modeFinancement,
        articles: dto.articles,
      }),
    );
  }

  async saisirCoursesExpress(
    dto: SaisieManuelleCoursesExpressDto,
    adminId: string,
  ) {
    const clientId = await this.resoudreClient(
      dto.clientTelephone,
      dto.clientNom,
    );
    return this.marquerSaisie(
      adminId,
      this.commandesCoursesExpress.create(clientId, {
        description: dto.description,
        zoneId: dto.zoneId,
        modePaiement: dto.modePaiement,
        etapes: dto.etapes,
      }),
    );
  }
}
