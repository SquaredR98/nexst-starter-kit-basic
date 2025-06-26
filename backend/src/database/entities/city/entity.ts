import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { State } from '../state/entity';
import { Country } from '../country/entity';
import { Pincode } from '../pincode/entity';
import { Address } from '../address/entity';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => State, state => state.cities)
  state: State;

  @ManyToOne(() => Country, country => country.cities)
  country: Country;

  @OneToMany(() => Pincode, pincode => pincode.city)
  pincodes: Pincode[];

  @OneToMany(() => Address, address => address.city)
  addresses: Address[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 