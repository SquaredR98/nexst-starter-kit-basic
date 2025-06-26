import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { User } from '../user/entity';
import { Tenant } from '../tenant/entity';
import { Address } from '../address/entity';
import { EmployeeDetails } from '../employee-details/entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, user => user.profile)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Tenant, tenant => tenant.profiles)
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ nullable: true })
  display_name: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ nullable: true })
  employee_number: string;

  @Column({ nullable: true })
  customer_code: string;

  @Column({ nullable: true })
  vendor_code: string;

  @Column({ type: 'jsonb', nullable: true })
  extra: Record<string, any>;

  @OneToMany(() => Address, address => address.profile)
  addresses: Address[];

  @OneToOne(() => EmployeeDetails, employeeDetails => employeeDetails.profile)
  employeeDetails: EmployeeDetails;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
} 