import { TenantStatus } from '../../../database/entities/tenant/entity';

export class UpdateTenantDto {
  name?: string;
  code?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: TenantStatus;
  plan?: string;
  settings?: Record<string, any>;
} 