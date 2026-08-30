export interface AuthenticatedUser {
  id: string;
  role: string;
  permissions: string[];
}

export interface JwtPayload {
  sub: string;
  role: string;
}
