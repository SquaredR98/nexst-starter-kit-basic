export interface User {
  id: string;
  email: string;
  emailVerified: Date | null;
  profile?: UserProfile;
  roles?: UserRole[];
}

export interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

export interface UserRole {
  role: {
    id: string;
    name: string;
    description: string | null;
    permissions?: RolePermission[];
  };
}

export interface RolePermission {
  permission: {
    id: string;
    resource: string;
    action: string;
    description: string | null;
  };
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface Session {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export interface OAuthAccount {
  provider: string;
  providerId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface VerifyTwoFactorData {
  token: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
