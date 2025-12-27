// DTO type definitions (will be populated as we build auth modules)
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    emailVerified: Date | null;
  };
}

export interface RefreshTokenDto {
  refreshToken: string;
}
