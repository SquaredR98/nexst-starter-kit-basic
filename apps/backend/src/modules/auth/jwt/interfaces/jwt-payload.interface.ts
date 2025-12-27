export interface JwtPayload {
  sub: string; // User ID
  email: string;
  roles: string[];
  sessionId?: string;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string; // User ID
  sessionId: string;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
