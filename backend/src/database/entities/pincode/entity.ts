import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { City } from '../city/entity';
import { State } from '../state/entity';
import { Country } from '../country/entity';
import { Address } from '../address/entity';

@Entity('pincodes')
export class Pincode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @ManyToOne(() => City, city => city.pincodes)
  city: City;

  @ManyToOne(() => State, state => state.pincodes)
  state: State;

  @ManyToOne(() => Country, country => country.pincodes)
  country: Country;

  @OneToMany(() => Address, address => address.pincode)
  addresses: Address[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 