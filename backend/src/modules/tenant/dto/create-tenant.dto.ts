import { TenantStatus } from '../../../database/entities/tenant/entity';

export class CreateTenantDto {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: TenantStatus;
  plan?: string;
  settings?: Record<string, any>;
} 