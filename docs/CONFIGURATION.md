# Configuration Guide

Complete guide to configuring the Auth Starter Kit for your environment.

## Overview

The application uses **environment variables** for configuration, validated at startup using `class-validator`. All configuration is type-safe and documented.

## Environment Files

### `.env` (Development)
Primary environment file for local development.

### `.env.example` (Template)
Template file committed to version control with dummy values.

### `.env.production` (Production)
Production environment file (not committed to Git).

## Required Environment Variables

### Application Settings

```bash
# Application
NODE_ENV=development                 # Environment: development | production | test
PORT=3000                           # Server port
API_PREFIX=api/v1                   # Global API prefix
```

**Validation Rules:**
- `NODE_ENV`: Must be one of: `development`, `production`, `test`
- `PORT`: Must be between 1000-65535
- `API_PREFIX`: Required string

---

### Database Configuration

```bash
# Database
DB_HOST=localhost                    # PostgreSQL host
DB_PORT=4000                        # PostgreSQL port (mapped in docker-compose)
DB_USERNAME=auth_user               # Database username
DB_PASSWORD=secure_password         # Database password
DB_DATABASE=auth_db                 # Database name
```

**Validation Rules:**
- `DB_HOST`: Required string
- `DB_PORT`: Required number
- `DB_USERNAME`: Required string
- `DB_PASSWORD`: Required string
- `DB_DATABASE`: Required string

**Production Considerations:**
- Use managed database services (AWS RDS, Google Cloud SQL)
- Enable SSL connections
- Use strong passwords (20+ characters)
- Restrict network access with security groups

---

### Redis Configuration

```bash
# Redis
REDIS_HOST=localhost                # Redis host
REDIS_PORT=6379                     # Redis port
REDIS_PASSWORD=                     # Redis password (optional for local dev)
```

**Validation Rules:**
- `REDIS_HOST`: Required string
- `REDIS_PORT`: Required number
- `REDIS_PASSWORD`: Optional string

**Production Considerations:**
- Enable password authentication
- Use managed Redis (AWS ElastiCache, Google Memorystore)
- Enable TLS encryption
- Configure persistence based on needs

---

### JWT Configuration

```bash
# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_ACCESS_EXPIRATION=15m           # Access token expiry
JWT_REFRESH_EXPIRATION=7d           # Refresh token expiry
```

**Validation Rules:**
- `JWT_SECRET`: Required string (min 32 characters recommended)
- `JWT_REFRESH_SECRET`: Required string (min 32 characters recommended)
- `JWT_ACCESS_EXPIRATION`: Required string (format: `15m`, `1h`, `1d`)
- `JWT_REFRESH_EXPIRATION`: Required string (format: `7d`, `30d`)

**Security Best Practices:**
- Use cryptographically random secrets (256-bit minimum)
- Different secrets for access and refresh tokens
- Rotate secrets periodically
- Never commit secrets to version control

**Generating Secure Secrets:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64

# Python
python -c "import secrets; print(secrets.token_hex(64))"
```

---

### Security Configuration

```bash
# Security
BCRYPT_ROUNDS=10                    # Bcrypt/Argon2 rounds (10-12 recommended)
```

**Validation Rules:**
- `BCRYPT_ROUNDS`: Must be between 10-15

**Performance vs Security:**
| Rounds | Time (approx) | Security Level |
|--------|---------------|----------------|
| 10 | ~100ms | Good for most apps |
| 12 | ~400ms | Recommended |
| 14 | ~1.6s | High security |
| 15 | ~3.2s | Very high security |

---

## Optional Environment Variables

### CORS Configuration

```bash
# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

**Default:** `*` (allow all origins in development)

**Production Setup:**
```bash
ALLOWED_ORIGINS=https://app.yourdomain.com,https://www.yourdomain.com
```

---

### OAuth Providers

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback
```

**Setup Instructions:** See [OAuth Setup Guide](./guides/oauth-setup.md)

---

### Two-Factor Authentication

```bash
# 2FA Settings
TOTP_ISSUER=AuthStarterKit          # TOTP issuer name
TOTP_WINDOW=1                       # Time window for TOTP validation (±30s)

# SMS Provider (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

### Email Service

```bash
# Email (SendGrid/AWS SES/SMTP)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_PROVIDER=sendgrid             # sendgrid | ses | smtp

# SendGrid
SENDGRID_API_KEY=your-sendgrid-key

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Configuration Files

### Database Configuration
**Location:** `src/config/database.config.ts`

```typescript
export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/database/entities/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false, // Never true in production
  logging: process.env.NODE_ENV === 'development',
}));
```

**Key Settings:**
- `synchronize: false` - Always use migrations in production
- `logging: true` - Enable in development for debugging

---

### Redis Configuration
**Location:** `src/config/redis.config.ts`

```typescript
export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  ttl: 3600, // Default TTL: 1 hour
}));
```

---

### JWT Configuration
**Location:** `src/config/jwt.config.ts`

```typescript
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  algorithm: 'HS256',
  issuer: 'auth-starter-kit',
}));
```

**Customization:**
Change `algorithm` to `RS256` for public/private key signing:
```typescript
algorithm: 'RS256',
privateKey: process.env.JWT_PRIVATE_KEY,
publicKey: process.env.JWT_PUBLIC_KEY,
```

---

### Security Configuration
**Location:** `src/config/security.config.ts`

```typescript
export default registerAs('security', () => ({
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  rateLimiting: {
    ttl: 60, // 1 minute
    limit: 100, // 100 requests per minute
  },
  passwordPolicy: {
    minStrength: 3, // zxcvbn score (0-4)
    historyCount: 5, // Prevent reuse of last 5 passwords
    lockoutAttempts: 5, // Lock account after 5 failed attempts
    lockoutDuration: 1800, // 30 minutes in seconds
  },
  session: {
    maxConcurrent: 5, // Max concurrent sessions per user
    trackLocation: true, // Enable GeoIP tracking
    suspiciousLoginAlerts: true, // Alert on suspicious logins
  },
}));
```

---

## Environment Validation

The application validates all environment variables at startup using `class-validator`.

**Location:** `src/config/validation/env.validation.ts`

### Validation Example

```typescript
export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(1000)
  @Max(65535)
  PORT: number;

  @IsString()
  JWT_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
```

**Benefits:**
- Type safety at runtime
- Clear error messages for misconfiguration
- Prevents application start with invalid config

---

## Configuration Usage in Code

### Injecting ConfigService

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

  getJWTSecret(): string {
    return this.configService.get<string>('jwt.secret');
  }

  getDatabaseHost(): string {
    return this.configService.get<string>('database.host');
  }
}
```

### Type-Safe Access

```typescript
// Get with type
const port = this.configService.get<number>('PORT');

// Get with default
const apiPrefix = this.configService.get<string>('API_PREFIX', 'api/v1');

// Get nested config
const jwtSecret = this.configService.get<string>('jwt.secret');
```

---

## Environment-Specific Configurations

### Development

```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=4000
REDIS_HOST=localhost

# Relaxed security for dev
JWT_ACCESS_EXPIRATION=1h
BCRYPT_ROUNDS=10
```

### Production

```bash
NODE_ENV=production
PORT=8080
DB_HOST=prod-db.example.com
DB_PORT=5432
REDIS_HOST=prod-redis.example.com

# Strict security for prod
JWT_ACCESS_EXPIRATION=5m
BCRYPT_ROUNDS=12
```

### Testing

```bash
NODE_ENV=test
PORT=3001
DB_HOST=localhost
DB_PORT=5433
REDIS_HOST=localhost

# Fast settings for tests
BCRYPT_ROUNDS=4
JWT_ACCESS_EXPIRATION=5m
```

---

## Docker Configuration

### Docker Compose

**Location:** `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USERNAME:-auth_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secure_password}
      POSTGRES_DB: ${DB_DATABASE:-auth_db}
    ports:
      - "${DB_PORT:-4000}:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "${REDIS_PORT:-6379}:6379"
```

**Usage:**
```bash
# Use .env values
docker-compose up -d

# Override with custom values
DB_PORT=5433 docker-compose up -d
```

---

## Configuration Best Practices

### 1. Never Commit Secrets
```bash
# .gitignore
.env
.env.production
.env.local
```

### 2. Use Different Secrets Per Environment
- Development: Simple secrets for ease of use
- Staging: Production-like secrets
- Production: Strong, rotated secrets

### 3. Secret Management
- **Development:** `.env` file
- **Production:** AWS Secrets Manager, HashiCorp Vault, K8s Secrets

### 4. Validate Early
Application validates config at startup and fails fast if invalid.

### 5. Document All Variables
Update this guide when adding new configuration options.

---

## Troubleshooting

### Application Won't Start

**Error:** `Error: An instance of EnvironmentVariables has failed the validation`

**Solution:** Check your `.env` file for:
- Missing required variables
- Invalid values (wrong types, out of range)
- Typos in variable names

### Database Connection Failed

**Error:** `ECONNREFUSED`

**Solution:**
1. Check `DB_HOST` and `DB_PORT` are correct
2. Ensure PostgreSQL container is running: `docker-compose ps`
3. Verify credentials match docker-compose.yml

### Redis Connection Failed

**Error:** `Redis connection refused`

**Solution:**
1. Check `REDIS_HOST` and `REDIS_PORT`
2. Ensure Redis container is running
3. Check password if authentication is enabled

---

## Next Steps

- Review [Architecture](./ARCHITECTURE.md)
- Setup [OAuth Providers](./guides/oauth-setup.md)
- Configure [JWT Settings](./guides/jwt-configuration.md)
- Read [Security Best Practices](./guides/security-best-practices.md)

---

**Last Updated:** 2024-12-20
**Config Version:** 1.0.0
