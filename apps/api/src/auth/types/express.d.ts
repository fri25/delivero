import type { AuthenticatedUser } from './auth-user.type';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      /** Company of the request, set by TenantMiddleware (étape 4). */
      tenantId?: string;
    }
  }
}
