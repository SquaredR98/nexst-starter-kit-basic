import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Profile } from '../profile/entity';
import { City } from '../city/entity';
import { State } from '../state/entity';
import { Country } from '../country/entity';
import { Pincode } from '../pincode/entity';

export enum AddressType {
  HOME = 'HOME',
  WORK = 'WORK',
  BILLING = 'BILLING',
  SHIPPING = 'SHIPPING',
}

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Profile, profile => profile.addresses)
  profile: Profile;

  @Column({ type: 'enum', enum: AddressType })
  type: AddressType;

  @Column()
  line1: string;

  @Column({ nullable: true })
  line2: string;

  @ManyToOne(() => City, city => city.addresses)
  city: City;

  @ManyToOne(() => State, state => state.addresses)
  state: State;

  @ManyToOne(() => Country, country => country.addresses)
  country: Country;

  @ManyToOne(() => Pincode, pincode => pincode.addresses)
  pincode: Pincode;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 