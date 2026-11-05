import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { TENANT_PAR_DEFAUT } from '../auth/appartenance';
import type { JwtPayload } from '../auth/types/auth-user.type';
import { contexteTenant } from '../tenancy/contexte-tenant';

// Temps réel minimal (F-CLI-05 / F-RES-01) : remplace le polling pour le
// suivi client et l'alerte nouvelle commande côté restaurant. Une seule
// room par utilisateur (client, restaurant ou livreur sont tous des User
// id) — pas de topic par service, le payload transporte typeService.
// Le polling existant côté front n'est pas retiré : ce canal est un plus,
// pas la seule source de vérité (reconnexion, robustesse 3G instable).
const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: { origin: corsOrigins.length > 0 ? corsOrigins : true },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      // A socket only hears the company of its session (étape 4).
      void client.join(
        this.userRoom(payload.tid ?? TENANT_PAR_DEFAUT, payload.sub),
      );
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket ${client.id} déconnecté.`);
  }

  /** Emits in the company of the current request or background task. */
  emitToUser(userId: string, event: string, payload: unknown) {
    const tenantId = contexteTenant()?.tenantId ?? TENANT_PAR_DEFAUT;
    this.server.to(this.userRoom(tenantId, userId)).emit(event, payload);
  }

  private userRoom(tenantId: string, userId: string): string {
    return `tenant:${tenantId}:user:${userId}`;
  }
}
