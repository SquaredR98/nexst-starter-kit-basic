import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('two_factor')
@Index(['userId'], { unique: true })
export class TwoFactor extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ name: 'secret', type: 'text' })
  secret: string;

  @Column({ name: 'is_enabled', type: 'boolean', default: false })
  isEnabled: boolean;

  @Column({ name: 'enabled_at', type: 'timestamp', nullable: true })
  enabledAt: Date | null;

  @Column({ name: 'backup_codes', type: 'jsonb', default: '[]' })
  backupCodes: string[];

  // Relations
  @OneToOne(() => User, (user) => user.twoFactor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
