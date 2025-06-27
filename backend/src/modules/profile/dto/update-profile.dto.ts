export class UpdateProfileDto {
  user_id?: number;
  tenant_id?: number;
  name?: string;
  display_name?: string;
  gender?: string;
  dob?: Date;
  avatar_url?: string;
  employee_number?: string;
  customer_code?: string;
  vendor_code?: string;
  extra?: Record<string, any>;
} 