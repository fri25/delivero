import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { Messagerie } from '../notifications/messagerie';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { DemanderOtpDto, VerifierOtpDto } from './dto/otp.dto';
import { normaliserTelephoneBenin, variantesTelephone } from './telephone';

const CLIENT_ROLE_NAME = 'client';
const DUREE_VALIDITE_MS = 10 * 60 * 1000;
const DELAI_ENTRE_ENVOIS_MS = 60 * 1000;
const ENVOIS_MAX_PAR_HEURE = 5;
const TENTATIVES_MAX = 5;
const SALT_ROUNDS = 10;

/**
 * F-CLI-01: sign-in / sign-up by one-time code sent by WhatsApp/SMS, as an
 * alternative to the password (decision of 2026-10-05). Client accounts only:
 * staff accounts (restaurant, livreur, admin) keep their password.
 *
 * Also lets a client created by the dispatcher (F-ADM-04, account without a
 * password) take over their account.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagerie: Messagerie,
    private readonly authService: AuthService,
  ) {}

  async demander(dto: DemanderOtpDto) {
    const telephone = this.normaliser(dto.telephone);
    const user = await this.trouverUtilisateur(telephone);
    if (user && user.role.name !== CLIENT_ROLE_NAME) {
      throw new BadRequestException(
        'Ce compte se connecte avec son mot de passe.',
      );
    }

    // Per-number limits on top of the per-IP throttle: SMS cost a lot and a
    // number must not be flooded by someone else.
    const maintenant = Date.now();
    const recents = await this.prisma.otpCode.findMany({
      where: {
        telephone,
        createdAt: { gte: new Date(maintenant - 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (
      recents[0] &&
      maintenant - recents[0].createdAt.getTime() < DELAI_ENTRE_ENVOIS_MS
    ) {
      throw new HttpException(
        'Patientez une minute avant de redemander un code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (recents.length >= ENVOIS_MAX_PAR_HEURE) {
      throw new HttpException(
        'Trop de codes demandés pour ce numéro. Réessayez dans une heure.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.prisma.$transaction([
      // Only the latest code is valid.
      this.prisma.otpCode.updateMany({
        where: { telephone, consumedAt: null },
        data: { consumedAt: new Date(maintenant) },
      }),
      this.prisma.otpCode.create({
        data: {
          telephone,
          codeHash: await bcrypt.hash(code, SALT_ROUNDS),
          userId: user?.id,
          expiresAt: new Date(maintenant + DUREE_VALIDITE_MS),
        },
      }),
    ]);

    try {
      await this.messagerie.envoyer(
        telephone,
        `Votre code ChapExpress : ${code}. Valable 10 minutes. Ne le communiquez à personne, pas même à un livreur.`,
      );
    } catch (error) {
      this.logger.error(
        `Envoi du code OTP impossible vers ${telephone}`,
        error,
      );
      throw new ServiceUnavailableException(
        'Le code n’a pas pu être envoyé. Réessayez dans un instant.',
      );
    }

    return {
      telephone,
      nouveauCompte: !user,
      expireDansSecondes: DUREE_VALIDITE_MS / 1000,
    };
  }

  async verifier(dto: VerifierOtpDto) {
    const telephone = this.normaliser(dto.telephone);
    const otp = await this.prisma.otpCode.findFirst({
      where: { telephone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.tentatives >= TENTATIVES_MAX) {
      throw new UnauthorizedException('Code expiré. Demandez un nouveau code.');
    }

    if (!(await bcrypt.compare(dto.code, otp.codeHash))) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { tentatives: { increment: 1 } },
      });
      throw new UnauthorizedException('Code incorrect.');
    }

    let user = await this.trouverUtilisateur(telephone);
    if (user && user.role.name !== CLIENT_ROLE_NAME) {
      throw new BadRequestException(
        'Ce compte se connecte avec son mot de passe.',
      );
    }
    // Checked before consuming the code, so the client can resend with a name.
    if (!user && !dto.nom?.trim()) {
      throw new BadRequestException(
        'Indiquez votre nom pour créer votre compte.',
      );
    }

    // Atomic consumption: a code opens at most one session.
    const { count } = await this.prisma.otpCode.updateMany({
      where: { id: otp.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (count === 0) {
      throw new UnauthorizedException(
        'Code déjà utilisé. Demandez un nouveau code.',
      );
    }

    user ??= await this.creerClient(telephone, dto.nom!.trim());
    return this.authService.buildAuthResponse(user);
  }

  private normaliser(saisie: string): string {
    const telephone = normaliserTelephoneBenin(saisie);
    if (!telephone) {
      throw new BadRequestException(
        'Numéro béninois invalide (ex. 01 57 86 69 59).',
      );
    }
    return telephone;
  }

  private trouverUtilisateur(telephone: string) {
    return this.prisma.user.findFirst({
      where: { telephone: { in: variantesTelephone(telephone) } },
      include: { role: true },
    });
  }

  private async creerClient(telephone: string, nom: string) {
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: CLIENT_ROLE_NAME },
    });
    try {
      return await this.prisma.user.create({
        data: { telephone, nom, passwordHash: null, roleId: role.id },
        include: { role: true },
      });
    } catch (error) {
      // Two verifications racing for the same new number.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return this.prisma.user.findUniqueOrThrow({
          where: { telephone },
          include: { role: true },
        });
      }
      throw error;
    }
  }
}
