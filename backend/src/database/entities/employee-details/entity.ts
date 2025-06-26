import { Entity, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Profile } from '../profile/entity';

@Entity('employee_details')
export class EmployeeDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Profile, profile => profile.employeeDetails)
  @JoinColumn()
  profile: Profile;

  @Column({ type: 'jsonb', nullable: true })
  salary_structure: Record<string, any>;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  designation: string;

  @Column({ type: 'date', nullable: true })
  joining_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 