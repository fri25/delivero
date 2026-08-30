import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/types/auth-user.type';

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
      void client.join(this.userRoom(payload.sub));
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket ${client.id} déconnecté.`);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(this.userRoom(userId)).emit(event, payload);
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }
}
