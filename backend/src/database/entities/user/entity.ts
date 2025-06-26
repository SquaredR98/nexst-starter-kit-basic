import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn } from 'typeorm';
import { Tenant } from '../tenant/entity';
import { Profile } from '../profile/entity';

export enum UserType {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true, default: () => 'uuid_generate_v4()' })
  uuid: string;

  @Column()
  user_id: string;

  @ManyToOne(() => Tenant, tenant => tenant.users)
  tenant: Tenant;

  @Column({ type: 'enum', enum: UserType })
  user_type: UserType;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  oauth_provider: string;

  @Column({ nullable: true })
  oauth_id: string;

  @Column({ nullable: true })
  refresh_token: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;

  @OneToOne(() => Profile, profile => profile.user)
  profile: Profile;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
} 