export interface AuthenticatedUser {
  id: string;
  role: string;
  permissions: string[];
}

export interface JwtPayload {
  sub: string;
  role: string;
  /** Company of the session (étape 4); absent from tokens issued before. */
  tid?: string;
}
