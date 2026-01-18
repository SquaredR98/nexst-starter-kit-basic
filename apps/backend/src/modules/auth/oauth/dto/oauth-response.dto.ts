export class OAuthAccountDto {
  provider: string;
  providerId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export class OAuthAccountListDto {
  accounts: OAuthAccountDto[];
}

export class OAuthLoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    emailVerified: Date | null;
  };
  isNewUser: boolean;
}
