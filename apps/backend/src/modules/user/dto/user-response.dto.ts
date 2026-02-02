export class ProfileResponseDto {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  phoneVerified: boolean;
}

export class PermissionDto {
  id: string;
  resource: string;
  action: string;
  description: string | null;
}

export class RolePermissionDto {
  permission: PermissionDto;
}

export class RoleDto {
  id: string;
  name: string;
  description: string | null;
  permissions?: RolePermissionDto[];
}

export class UserRoleDto {
  role: RoleDto;
}

export class UserResponseDto {
  id: string;
  email: string;
  emailVerified: Date | null;
  profile: ProfileResponseDto | null;
  roles: UserRoleDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class UserListResponseDto {
  users: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
}
