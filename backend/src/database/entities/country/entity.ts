import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { State } from '../state/entity';
import { City } from '../city/entity';
import { Pincode } from '../pincode/entity';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  iso_code: string;

  @OneToMany(() => State, state => state.country)
  states: State[];

  @OneToMany(() => City, city => city.country)
  cities: City[];

  @OneToMany(() => Pincode, pincode => pincode.country)
  pincodes: Pincode[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 