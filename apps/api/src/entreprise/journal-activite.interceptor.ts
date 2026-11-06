import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { concatMap, Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

const METHODES_ECRITURE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Activity journal (étape 8 of docs/plan-migration-multi-tenant.md): every
 * request of a signed-in account that changes data and succeeds is written
 * to audit_logs, for its company. Only the route, the target id and the
 * keys of the body are kept, never the values (passwords, FedaPay keys,
 * amounts typed by mistake). Never throws: a failure to log must not turn a
 * successful request into an error.
 */
@Injectable()
export class JournalActiviteInterceptor implements NestInterceptor {
  private readonly logger = new Logger(JournalActiviteInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const requete = context.switchToHttp().getRequest<Request>();
    if (!METHODES_ECRITURE.has(requete.method)) return next.handle();

    // Written before the response leaves: the journal is up to date as soon
    // as the client sees the change.
    return next.handle().pipe(
      concatMap(async (reponse: unknown) => {
        // Public routes (sign-in, webhooks) have no account: not journaled.
        if (requete.user && requete.tenantId) {
          await this.ecrire(requete, requete.tenantId);
        }
        return reponse;
      }),
    );
  }

  private async ecrire(requete: Request, tenantId: string) {
    const route = (requete.route as { path?: string } | undefined)?.path;
    const corps: unknown = requete.body;
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          acteurId: requete.user?.id,
          action: `${requete.method} ${route ?? requete.path}`,
          cibleId:
            typeof requete.params?.id === 'string' ? requete.params.id : null,
          ip: requete.ip,
          details: {
            chemin: requete.path,
            champs:
              corps && typeof corps === 'object' && !Array.isArray(corps)
                ? Object.keys(corps)
                : [],
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Journal d’activité indisponible : ${(error as Error).message}`,
      );
    }
  }
}
