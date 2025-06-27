import { UserType, UserStatus } from '../../../database/entities/user/entity';

export class UpdateUserDto {
  user_id?: string;
  tenant_id?: number;
  user_type?: UserType;
  password?: string;
  email?: string;
  phone?: string;
  oauth_provider?: string;
  oauth_id?: string;
  refresh_token?: string;
  status?: UserStatus;
} 