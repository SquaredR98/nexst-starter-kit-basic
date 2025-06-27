import { AddressType } from '../../../database/entities/address/entity';

export class UpdateAddressDto {
  profile_id?: number;
  type?: AddressType;
  line1?: string;
  line2?: string;
  city_id?: number;
  state_id?: number;
  country_id?: number;
  pincode_id?: number;
} 