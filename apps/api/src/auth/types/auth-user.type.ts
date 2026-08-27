export interface AuthenticatedUser {
  id: string;
  role: string;
}

export interface JwtPayload {
  sub: string;
  role: string;
}
