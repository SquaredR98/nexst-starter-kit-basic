// Entity type definitions
export interface IUser {
  id: string;
  email: string;
  emailVerified: Date | null;
  failedAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProfile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  phoneVerified: boolean;
}

export interface IRole {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface ISession {
  id: string;
  userId: string;
  refreshToken: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastActiveAt: Date;
  createdAt: Date;
}
