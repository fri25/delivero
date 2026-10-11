import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TypeService } from '@prisma/client';
import { normaliserTelephoneBenin } from '../auth/telephone';
import { CommandesColisService } from '../commandes-colis/commandes-colis.service';
import { CommandesCoursesExpressService } from '../commandes-courses-express/commandes-courses-express.service';
import { CommandesRepasService } from '../commandes-repas/commandes-repas.service';
import { NotationsService } from '../notations/notations.service';
import { NoterCommandeDto } from '../notations/dto/noter-commande.dto';
import { JetonInviteService } from '../notifications/jeton-invite.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaiementsService } from '../paiements/paiements.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdresseInviteDto,
  ContactInviteDto,
  CreateCommandeColisInviteDto,
  CreateCommandeCoursesExpressInviteDto,
  CreateCommandeRepasInviteDto,
} from './dto/commande-invite.dto';
import type { InfosInvite } from './infos-invite';

const LIBELLE_ADRESSE_INVITE = 'Adresse (commande sans compte)';

/**
 * F-CLI-02: ordering without an account (decision of 2026-10-06). The guest
 * gives a name and a phone, pays upfront like everyone (unpaid orders reach
 * nobody), and gets back a signed tracking link — also sent by WhatsApp/SMS —
 * which is the only key to the order afterwards: track, pay, cancel, rate.
 *
 * Emplettes is not offered to guests (hidden in V1).
 */
@Injectable()
export class InviteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repas: CommandesRepasService,
    private readonly colis: CommandesColisService,
    private readonly coursesExpress: CommandesCoursesExpressService,
    private readonly paiements: PaiementsService,
    private readonly notations: NotationsService,
    private readonly notifications: NotificationsService,
    private readonly jetonInvite: JetonInviteService,
  ) {}

  async creerRepas(dto: CreateCommandeRepasInviteDto) {
    const { invite, adresse, ...commande } = dto;
    const contact = this.contact(invite);
    const adresseId = await this.creerAdresse(adresse);
    const cree = await this.annulerAdresseSiEchec(adresseId, () =>
      this.repas.create(null, { ...commande, adresseId }, contact),
    );
    return this.reponseCreation(
      TypeService.repas,
      cree.commande.id,
      cree.id,
      contact,
    );
  }

  async creerColis(dto: CreateCommandeColisInviteDto) {
    const { invite, adresseEnlevement, ...commande } = dto;
    const contact = this.contact(invite);
    const adresseEnlevementId = await this.creerAdresse(adresseEnlevement);
    const cree = await this.annulerAdresseSiEchec(adresseEnlevementId, () =>
      this.colis.create(null, { ...commande, adresseEnlevementId }, contact),
    );
    return this.reponseCreation(
      TypeService.colis,
      cree.commande.id,
      cree.id,
      contact,
    );
  }

  async creerCoursesExpress(dto: CreateCommandeCoursesExpressInviteDto) {
    const { invite, ...commande } = dto;
    const contact = this.contact(invite);
    const cree = await this.coursesExpress.create(null, commande, contact);
    return this.reponseCreation(
      TypeService.courses_express,
      cree.commande.id,
      cree.id,
      contact,
    );
  }

  /** Guest tracking page: the order as its owner sees it. */
  async suivi(jeton: string) {
    const commande = await this.resoudre(jeton);
    return {
      typeService: commande.typeService,
      commandeServiceId: commande.commandeServiceId,
      commande: await this.detail(
        commande.typeService,
        commande.commandeServiceId,
      ),
    };
  }

  async initierPaiement(jeton: string) {
    const { id } = await this.resoudre(jeton);
    return this.paiements.initierInvite(id, jeton);
  }

  async synchroniserPaiement(jeton: string) {
    const { id } = await this.resoudre(jeton);
    return this.paiements.synchroniserInvite(id);
  }

  async annuler(jeton: string) {
    const { id, typeService, commandeServiceId } = await this.resoudre(jeton);
    const demandeur = { commandeInviteId: id };
    switch (typeService) {
      case TypeService.repas:
        return this.repas.annuler(demandeur, commandeServiceId);
      case TypeService.colis:
        return this.colis.annuler(demandeur, commandeServiceId);
      case TypeService.courses_express:
        return this.coursesExpress.annuler(demandeur, commandeServiceId);
      default:
        throw new BadRequestException('Service non disponible sans compte.');
    }
  }

  async noter(jeton: string, dto: NoterCommandeDto) {
    const { id } = await this.resoudre(jeton);
    return this.notations.noter(await this.notations.getCommande(id), dto);
  }

  // Invalid, forged or non-guest links all answer 404 alike: nothing to learn
  // from probing.
  private async resoudre(jeton: string) {
    const commandeId = this.jetonInvite.verifier(jeton);
    const commande = commandeId
      ? await this.prisma.commande.findUnique({
          where: { id: commandeId },
          select: {
            id: true,
            typeService: true,
            clientId: true,
            commandeRepas: { select: { id: true } },
            commandeColis: { select: { id: true } },
            commandeCoursesExpress: { select: { id: true } },
          },
        })
      : null;
    const specialisation =
      commande?.commandeRepas ??
      commande?.commandeColis ??
      commande?.commandeCoursesExpress;
    if (!commande || commande.clientId !== null || !specialisation) {
      throw new NotFoundException('Commande introuvable.');
    }
    return {
      id: commande.id,
      typeService: commande.typeService,
      commandeServiceId: specialisation.id,
    };
  }

  private detail(typeService: TypeService, commandeServiceId: string) {
    switch (typeService) {
      case TypeService.repas:
        return this.repas.findOneForInvite(commandeServiceId);
      case TypeService.colis:
        return this.colis.findOneForInvite(commandeServiceId);
      case TypeService.courses_express:
        return this.coursesExpress.findOneForInvite(commandeServiceId);
      default:
        throw new NotFoundException('Commande introuvable.');
    }
  }

  private contact(invite: ContactInviteDto): InfosInvite {
    const telephone = normaliserTelephoneBenin(invite.telephone);
    if (!telephone) {
      throw new BadRequestException(
        'Numéro béninois invalide (ex. 01 57 86 69 59).',
      );
    }
    return { nom: invite.nom.trim(), telephone };
  }

  private async creerAdresse(adresse: AdresseInviteDto): Promise<string> {
    const creee = await this.prisma.adresse.create({
      data: {
        userId: null,
        libelle: LIBELLE_ADRESSE_INVITE,
        pointDeRepere: adresse.pointDeRepere.trim(),
        latitude: adresse.latitude,
        longitude: adresse.longitude,
      },
      select: { id: true },
    });
    return creee.id;
  }

  // The order services own their transaction; if they refuse (closed
  // restaurant, unavailable dish…), drop the address created just before.
  private async annulerAdresseSiEchec<T>(
    adresseId: string,
    creer: () => Promise<T>,
  ): Promise<T> {
    try {
      return await creer();
    } catch (error) {
      await this.prisma.adresse
        .delete({ where: { id: adresseId } })
        .catch(() => undefined);
      throw error;
    }
  }

  private reponseCreation(
    typeService: TypeService,
    commandeId: string,
    commandeServiceId: string,
    contact: InfosInvite,
  ) {
    this.notifications.commandeInviteCreee(contact.telephone, commandeId);
    return {
      jeton: this.jetonInvite.generer(commandeId),
      typeService,
      commandeId,
      commandeServiceId,
    };
  }
}
