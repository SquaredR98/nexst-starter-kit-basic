# User Entity

Core user account entity for authentication and identity management.

## Overview

The `User` entity represents the primary user account in the system. It stores authentication credentials, account status, and serves as the central point for all user-related relationships.

## Schema Definition

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | Yes | auto | Primary key (UUID v4) |
| `email` | VARCHAR(255) | Yes | - | User's email address (unique) |
| `emailVerified` | TIMESTAMP | No | null | When email was verified |
| `passwordHash` | VARCHAR(255) | No | null | Hashed password (Argon2id/Bcrypt) |
| `failedAttempts` | INTEGER | Yes | 0 | Failed login attempt counter |
| `lockedUntil` | TIMESTAMP | No | null | Account lock expiration time |
| `createdAt` | TIMESTAMP | Yes | now() | Account creation timestamp |
| `updatedAt` | TIMESTAMP | Yes | now() | Last update timestamp |

## TypeORM Entity

```typescript
import { Entity, Column, OneToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerified: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ type: 'int', default: 0 })
  failedAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  // Relations
  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile: Profile;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  roles: UserRole[];

  @OneToMany(() => OAuthAccount, (oauthAccount) => oauthAccount.user)
  oauthAccounts: OAuthAccount[];

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
  apiKeys: ApiKey[];

  @OneToOne(() => TwoFactor, (twoFactor) => twoFactor.user)
  twoFactor: TwoFactor;

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs: AuditLog[];

  @OneToMany(() => PasswordHistory, (passwordHistory) => passwordHistory.user)
  passwordHistory: PasswordHistory[];
}
```

## Relationships

### One-to-One

#### Profile
- **Direction:** User → Profile
- **Cascade:** DELETE (Profile deleted with User)
- **Description:** Extended user information (name, avatar, phone)

```typescript
const user = await userRepository.findOne({
  where: { id },
  relations: ['profile'],
});
```

#### TwoFactor
- **Direction:** User → TwoFactor
- **Cascade:** DELETE (2FA settings deleted with User)
- **Description:** Two-factor authentication configuration
- **Optional:** User may not have 2FA enabled

### One-to-Many

#### Roles (via UserRole)
- **Description:** User can have multiple roles
- **Junction:** UserRole entity
- **Cascade:** CASCADE (role assignments deleted with User)

```typescript
const user = await userRepository.findOne({
  where: { id },
  relations: ['roles', 'roles.role', 'roles.role.permissions'],
});
```

#### OAuthAccounts
- **Description:** Linked social login accounts
- **Cascade:** CASCADE
- **Business Rule:** One account per provider per user

#### Sessions
- **Description:** Active login sessions
- **Cascade:** CASCADE
- **Business Rule:** Max 5 concurrent sessions (configurable)

#### ApiKeys
- **Description:** User-generated API keys
- **Cascade:** CASCADE

#### PasswordHistory
- **Description:** Historical password hashes
- **Cascade:** CASCADE
- **Business Rule:** Keep last 5 passwords

#### AuditLogs
- **Description:** User activity audit trail
- **Cascade:** SET NULL (preserve logs after user deletion)

## Indexes

```sql
-- Primary key
CREATE UNIQUE INDEX pk_users ON users(id);

-- Email lookup (used for login)
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Account status queries
CREATE INDEX idx_users_locked_until ON users(locked_until)
  WHERE locked_until IS NOT NULL;
```

## Business Rules

### Email Validation
1. Must be unique across all users
2. Must be valid email format
3. Case-insensitive uniqueness (stored lowercase)
4. Cannot be changed after registration (in basic version)

### Password Management
1. `passwordHash` is nullable (OAuth-only users)
2. Never store plain passwords
3. Hash with Argon2id (or Bcrypt fallback)
4. Track last 5 passwords in `PasswordHistory`
5. Prevent password reuse

### Account Lockout
1. Increment `failedAttempts` on failed login
2. Lock account when `failedAttempts >= 5` (configurable)
3. Set `lockedUntil` to `now() + 30 minutes`
4. Reset `failedAttempts` to 0 on successful login
5. Auto-unlock when `lockedUntil` expires

### Email Verification
1. `emailVerified` is null by default
2. Set to current timestamp when verified
3. Optional enforcement (configurable)
4. Send verification email on registration

## Common Queries

### Find User by Email

```typescript
const user = await userRepository.findOne({
  where: { email: email.toLowerCase() },
  relations: ['profile'],
});
```

### Find User with Roles and Permissions

```typescript
const user = await userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.roles', 'userRole')
  .leftJoinAndSelect('userRole.role', 'role')
  .leftJoinAndSelect('role.permissions', 'rolePermission')
  .leftJoinAndSelect('rolePermission.permission', 'permission')
  .where('user.id = :id', { id })
  .getOne();
```

### Find Active Sessions for User

```typescript
const sessions = await sessionRepository.find({
  where: {
    userId: user.id,
    revokedAt: IsNull(),
    expiresAt: MoreThan(new Date()),
  },
  order: { lastActiveAt: 'DESC' },
});
```

### Check if Account is Locked

```typescript
const isLocked = user.lockedUntil && user.lockedUntil > new Date();
```

### Find Users with Specific Role

```typescript
const users = await userRepository
  .createQueryBuilder('user')
  .innerJoin('user.roles', 'userRole')
  .innerJoin('userRole.role', 'role')
  .where('role.name = :roleName', { roleName: 'admin' })
  .getMany();
```

## Security Considerations

### Password Hashing

```typescript
import * as argon2 from 'argon2';

// Hash password
const passwordHash = await argon2.hash(plainPassword, {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
});

// Verify password
const isValid = await argon2.verify(user.passwordHash, plainPassword);
```

### Brute Force Protection

```typescript
// Increment failed attempts
user.failedAttempts += 1;

// Lock account after 5 failed attempts
if (user.failedAttempts >= 5) {
  user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
}

await userRepository.save(user);
```

### Sensitive Data Handling

**Never include in API responses:**
- `passwordHash`
- `failedAttempts`
- `lockedUntil`

**Use DTOs for responses:**
```typescript
export class UserResponseDto {
  id: string;
  email: string;
  emailVerified: Date | null;
  createdAt: Date;
  profile?: ProfileDto;
}
```

## Audit Events

All user-related actions are logged in `AuditLog`:

| Event | Description |
|-------|-------------|
| `user.created` | New user registration |
| `user.email_verified` | Email verification completed |
| `user.password_changed` | Password updated |
| `user.locked` | Account locked due to failed attempts |
| `user.unlocked` | Account unlocked (manual or auto) |
| `user.deleted` | User account deleted |

## Migration History

### Initial Migration (2024-12-20)
```typescript
await queryRunner.query(`
  CREATE TABLE "users" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "email" character varying(255) NOT NULL,
    "emailVerified" TIMESTAMP,
    "passwordHash" character varying(255),
    "failedAttempts" integer NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_users" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_users_email" UNIQUE ("email")
  )
`);
```

## Customization Examples

### Add Custom Fields

```typescript
// Add fields to User entity
@Column({ nullable: true })
companyName?: string;

@Column({ type: 'boolean', default: true })
isActive: boolean;

// Create migration
npm run migration:generate -- src/database/migrations/AddCustomFieldsToUser
```

### Add Soft Delete

```typescript
import { DeleteDateColumn } from 'typeorm';

@DeleteDateColumn()
deletedAt?: Date;
```

### Add Custom Validation

```typescript
import { BeforeInsert } from 'typeorm';

@BeforeInsert()
normalizeEmail() {
  this.email = this.email.toLowerCase().trim();
}
```

## Performance Optimization

### Avoid N+1 Queries

```typescript
// ❌ Bad: N+1 queries
const users = await userRepository.find();
for (const user of users) {
  user.profile = await profileRepository.findOne({ where: { userId: user.id } });
}

// ✅ Good: Single query with join
const users = await userRepository.find({
  relations: ['profile'],
});
```

### Pagination

```typescript
const [users, total] = await userRepository.findAndCount({
  skip: (page - 1) * limit,
  take: limit,
  order: { createdAt: 'DESC' },
});
```

### Partial Selection

```typescript
// Only select needed fields
const users = await userRepository
  .createQueryBuilder('user')
  .select(['user.id', 'user.email', 'user.createdAt'])
  .getMany();
```

## Testing Examples

### Unit Test

```typescript
describe('User Entity', () => {
  it('should create a user with email', () => {
    const user = new User();
    user.email = 'test@example.com';

    expect(user.email).toBe('test@example.com');
    expect(user.failedAttempts).toBe(0);
  });

  it('should lock account after 5 failed attempts', () => {
    const user = new User();
    user.failedAttempts = 5;
    user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);

    const isLocked = user.lockedUntil > new Date();
    expect(isLocked).toBe(true);
  });
});
```

## Related Documentation

- [Profile Entity](./profile.md)
- [Role Entity](./role.md)
- [Session Entity](./session.md)
- [OAuth Account Entity](./oauth.md)
- [Two-Factor Entity](./two-factor.md)
- [Password History Entity](./password-history.md)
- [Audit Log Entity](./audit-log.md)

---

**Last Updated:** 2024-12-20
**Entity Version:** 1.0.0
