import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Security events in audit_logs (architecture § 2.8). Never throws: a
 * failure to log must not turn a refused request into a server error.
 */
@Injectable()
export class JournalSecuriteService {
  private readonly logger = new Logger(JournalSecuriteService.name);

  constructor(private readonly prisma: PrismaService) {}

  async signaler(evenement: {
    action: string;
    tenantId: string | null;
    acteurId?: string;
    ip?: string;
    details?: Prisma.InputJsonValue;
  }) {
    this.logger.warn(
      `${evenement.action} (entreprise ${evenement.tenantId ?? '-'}, compte ${evenement.acteurId ?? '-'})`,
    );
    try {
      await this.prisma.auditLog.create({
        data: {
          action: evenement.action,
          tenantId: evenement.tenantId,
          acteurId: evenement.acteurId,
          ip: evenement.ip,
          details: evenement.details,
        },
      });
    } catch (error) {
      this.logger.error(
        `Journal de sécurité indisponible : ${(error as Error).message}`,
      );
    }
  }
}
