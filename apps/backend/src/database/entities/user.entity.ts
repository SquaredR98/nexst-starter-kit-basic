import { Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Profile } from './profile.entity';
import { UserRole } from './user-role.entity';
import { Session } from './session.entity';
import { OAuthAccount } from './oauth-account.entity';
import { TwoFactor } from './two-factor.entity';
import { PasswordHistory } from './password-history.entity';

@Entity('users')
@Index(['email'], { unique: true })
export class User extends BaseEntity {
  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({
    name: 'email_verified',
    type: 'timestamp',
    nullable: true,
  })
  emailVerified: Date | null;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordHash: string | null;

  @Column({
    name: 'failed_attempts',
    type: 'int',
    default: 0,
  })
  failedAttempts: number;

  @Column({
    name: 'locked_until',
    type: 'timestamp',
    nullable: true,
  })
  lockedUntil: Date | null;

  // Relations
  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile: Profile;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  roles: UserRole[];

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToMany(() => OAuthAccount, (oauth) => oauth.user)
  oauthAccounts: OAuthAccount[];

  @OneToOne(() => TwoFactor, (twoFactor) => twoFactor.user)
  twoFactor: TwoFactor;

  @OneToMany(() => PasswordHistory, (passwordHistory) => passwordHistory.user)
  passwordHistory: PasswordHistory[];
}
