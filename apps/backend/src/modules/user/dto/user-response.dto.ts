export class ProfileResponseDto {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  phoneVerified: boolean;
}

export class UserResponseDto {
  id: string;
  email: string;
  emailVerified: Date | null;
  profile: ProfileResponseDto | null;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class UserListResponseDto {
  users: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
}
