import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Country } from '../country/entity';
import { City } from '../city/entity';
import { Pincode } from '../pincode/entity';
import { Address } from '../address/entity';

@Entity('states')
export class State {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  code: string;

  @ManyToOne(() => Country, country => country.states)
  country: Country;

  @OneToMany(() => City, city => city.state)
  cities: City[];

  @OneToMany(() => Pincode, pincode => pincode.state)
  pincodes: Pincode[];

  @OneToMany(() => Address, address => address.state)
  addresses: Address[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 