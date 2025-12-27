# Product Tier Strategy

This document defines the feature differentiation between Basic and Premium tiers of the Auth Starter Kit.

## Overview

The Auth Starter Kit is sold in **two tiers** to maximize revenue and provide options for different customer needs:

- **Basic Tier ($79)**: Entry-level authentication system with core features
- **Premium Tier ($149-$299)**: Full-featured enterprise-ready authentication system

## Development Strategy

**We build Premium FIRST, then create Basic by feature removal.**

### Why Premium First?

1. Easier to remove features than add them later
2. Ensures Premium buyers get complete, tested product
3. Basic tier becomes a "feature-limited" version, not a separate codebase
4. Maintains code quality and consistency

---

## Feature Matrix

### ✅ = Included | ❌ = Not Included | 🔶 = Limited Version

| Category | Feature | Basic ($79) | Premium ($149) |
|----------|---------|-------------|----------------|
| **🔐 Authentication** |
| JWT Authentication | ✅ | ✅ |
| Password Auth (Argon2/Bcrypt) | ✅ | ✅ |
| Refresh Token Rotation | ✅ | ✅ |
| Email Verification | ✅ | ✅ |
| Password Reset | ✅ | ✅ |
| Account Lockout | ✅ | ✅ |
| Session Management | 🔶 Basic | ✅ Advanced |
| Device Tracking | ❌ | ✅ |
| GeoIP Location Tracking | ❌ | ✅ |
| Suspicious Activity Detection | ❌ | ✅ |
| Concurrent Session Limits | 🔶 Fixed (5) | ✅ Configurable |
| **🌐 OAuth / Social Login** |
| Google OAuth | ✅ | ✅ |
| GitHub OAuth | ✅ | ✅ |
| Microsoft OAuth | ❌ | ✅ |
| Apple OAuth | ❌ | ✅ |
| Account Linking | ✅ | ✅ |
| Profile Auto-Sync | ❌ | ✅ |
| **🔑 Two-Factor Authentication** |
| TOTP (Authenticator Apps) | ✅ | ✅ |
| QR Code Generation | ✅ | ✅ |
| Backup Codes | ✅ | ✅ |
| SMS 2FA | ❌ | ✅ |
| Email 2FA | ❌ | ✅ |
| Trusted Devices (Remember Me) | ❌ | ✅ |
| Role-Based 2FA Enforcement | ❌ | ✅ |
| **👥 Authorization (RBAC)** |
| Roles & Permissions | ✅ | ✅ |
| Role Assignment | ✅ | ✅ |
| Permission Checking | ✅ | ✅ |
| Hierarchical Roles | ❌ | ✅ |
| Role Inheritance | ❌ | ✅ |
| Dynamic Permissions | 🔶 Basic | ✅ Advanced |
| CASL/ABAC Integration | ❌ | ✅ |
| Resource-Level Permissions | ❌ | ✅ |
| **🔧 API Management** |
| API Key Generation | ❌ | ✅ |
| Scoped Permissions | ❌ | ✅ |
| Rate Limiting per Key | ❌ | ✅ |
| IP Whitelisting | ❌ | ✅ |
| IP Blacklisting | ❌ | ✅ |
| Usage Tracking | ❌ | ✅ |
| Key Expiration | ❌ | ✅ |
| Auto-Renewal | ❌ | ✅ |
| **🛡️ Security** |
| Helmet Security Headers | ✅ | ✅ |
| CORS Configuration | ✅ | ✅ |
| Rate Limiting | 🔶 Global | ✅ Per-User/Endpoint |
| Brute Force Protection | ✅ | ✅ |
| Password History | ✅ (last 5) | ✅ (configurable) |
| Password Strength Validation | ✅ | ✅ |
| CAPTCHA Integration | ❌ | ✅ |
| **📊 Audit & Logging** |
| Basic Audit Logs | ❌ | ✅ |
| Authentication Events | ❌ | ✅ |
| Authorization Events | ❌ | ✅ |
| Resource Change Tracking | ❌ | ✅ |
| Metadata Storage (IP, User-Agent) | ❌ | ✅ |
| Audit Export (CSV/JSON) | ❌ | ✅ |
| Compliance Reports | ❌ | ✅ |
| Audit Search & Filtering | ❌ | ✅ |
| **🗄️ Database** |
| TypeORM Entities | ✅ | ✅ |
| PostgreSQL Support | ✅ | ✅ |
| Manual Migration Execution | ✅ | ✅ |
| Migration CLI Tool | ❌ | ✅ |
| Prisma-like DX | ❌ | ✅ |
| Database Seeding | 🔶 Basic | ✅ Advanced |
| Migration Rollback | ✅ | ✅ |
| **🚀 Deployment** |
| Docker Compose (Dev) | ✅ | ✅ |
| Docker Compose (Production) | ❌ | ✅ |
| Dockerfile | ✅ Basic | ✅ Optimized |
| GitHub Actions Workflow | ❌ | ✅ |
| Jenkins Pipeline | ❌ | ✅ |
| Kubernetes Manifests | ❌ | ✅ |
| Health Checks | ✅ | ✅ |
| Environment Examples | ✅ | ✅ |
| **📚 Documentation** |
| Getting Started Guide | ✅ | ✅ |
| Database Schema Docs | 🔶 Basic | ✅ Detailed |
| Architecture Overview | 🔶 Basic | ✅ Detailed |
| API Documentation | ✅ | ✅ |
| Configuration Guide | ✅ | ✅ |
| Deployment Guide | 🔶 Basic | ✅ Advanced |
| JWT Configuration Guide | ❌ | ✅ |
| OAuth Setup Guide | 🔶 2 providers | ✅ All providers |
| RBAC Customization | 🔶 Basic | ✅ Advanced |
| Security Best Practices | ❌ | ✅ |
| Testing Guide | ❌ | ✅ |
| Frontend Examples | ❌ | ✅ |
| Video Tutorials | ❌ | ✅ |
| **🧪 Testing** |
| Unit Tests | 🔶 Core only | ✅ Comprehensive |
| Integration Tests | ❌ | ✅ |
| E2E Tests | ❌ | ✅ |
| Test Coverage Reports | ❌ | ✅ |
| **💼 Support & Updates** |
| Community Support | ✅ | ✅ |
| Email Support | ❌ | ✅ |
| Bug Fixes | 🔶 Critical only | ✅ All |
| Feature Updates | ❌ | ✅ 6 months |
| Priority Support | ❌ | ✅ |

---

## Implementation Guidelines

### When Building a Feature

**Always check this document before implementing:**

1. ✅ **Build for Premium tier** - Implement full-featured version
2. 🏷️ **Add tier tags** - Mark Premium-only code with comments
3. 🚩 **Use feature flags** - Conditional logic for tier differences
4. 📝 **Document tier** - Note in code comments which tier includes this
5. ✅ **Test both tiers** - Ensure Basic works without Premium features

### Code Tagging Convention

```typescript
// TIER: PREMIUM - Full audit logging
@Injectable()
export class AuditService {
  // Premium feature: detailed metadata tracking
  async logWithMetadata(event: AuditEvent) {
    // ...
  }
}

// TIER: BASIC - Simplified version
@Injectable()
export class BasicAuditService {
  // Basic tier: only critical events
  async logCritical(event: AuditEvent) {
    // ...
  }
}
```

### Feature Flag Pattern

```typescript
// config/tier.config.ts
export const TIER_CONFIG = {
  isBasic: process.env.TIER === 'basic',
  isPremium: process.env.TIER === 'premium',
};

// Usage in code
if (TIER_CONFIG.isPremium) {
  // Premium-only feature
  await this.auditService.logDetailed(event);
}
```

---

## File Structure for Tiers

```
auth-starter-kit/
├── src/
│   ├── modules/
│   │   ├── auth/                  # BOTH tiers
│   │   ├── rbac/                  # BOTH tiers
│   │   ├── session/               # BOTH tiers
│   │   ├── api-keys/              # PREMIUM ONLY
│   │   ├── audit/                 # PREMIUM ONLY
│   │   └── security/              # BOTH (enhanced in Premium)
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts        # BOTH
│   │   │   └── require-tier.decorator.ts  # Tier check
│   │
│   └── config/
│       └── tier.config.ts         # Tier configuration
│
├── cli/                           # PREMIUM ONLY
│   └── migration-tool/
│
├── deployment/
│   ├── docker/
│   │   ├── basic/                 # Basic Docker setup
│   │   └── premium/               # Premium with CI/CD
│   ├── github-actions/            # PREMIUM ONLY
│   └── jenkins/                   # PREMIUM ONLY
│
└── docs/
    ├── basic/                     # Basic tier docs
    └── premium/                   # Premium tier docs
```

---

## Entity Tier Mapping

| Entity | Basic | Premium | Notes |
|--------|-------|---------|-------|
| User | ✅ | ✅ | Same schema |
| Profile | ✅ | ✅ | Same schema |
| Role | ✅ | ✅ | Basic: flat, Premium: hierarchical |
| Permission | ✅ | ✅ | Same schema |
| UserRole | ✅ | ✅ | Same schema |
| RolePermission | ✅ | ✅ | Same schema |
| OAuthAccount | 🔶 | ✅ | Basic: 2 providers, Premium: 4 providers |
| Session | ✅ | ✅ | Basic: minimal tracking, Premium: full tracking |
| TwoFactor | 🔶 | ✅ | Basic: TOTP only, Premium: all methods |
| TrustedDevice | ❌ | ✅ | Premium only |
| ApiKey | ❌ | ✅ | Premium only |
| ApiKeyPermission | ❌ | ✅ | Premium only |
| PasswordHistory | ✅ | ✅ | Same schema |
| AuditLog | ❌ | ✅ | Premium only |

---

## Module Tier Mapping

| Module | Basic | Premium | Differences |
|--------|-------|---------|-------------|
| `auth/jwt` | ✅ | ✅ | Same |
| `auth/password` | ✅ | ✅ | Same |
| `auth/oauth` | 🔶 | ✅ | Basic: Google + GitHub only |
| `auth/two-factor` | 🔶 | ✅ | Basic: TOTP only |
| `rbac` | 🔶 | ✅ | Basic: no CASL/ABAC |
| `session` | 🔶 | ✅ | Basic: minimal tracking |
| `api-keys` | ❌ | ✅ | Premium only |
| `audit` | ❌ | ✅ | Premium only |
| `security` | 🔶 | ✅ | Basic: global rate limiting only |
| `users` | ✅ | ✅ | Same |

---

## Migration Strategy

### Basic Tier
- **Manual execution**: `npm run migration:run`
- **No CLI tool**
- **Basic seeding**: Roles and permissions only
- **Documentation**: Simple migration guide

### Premium Tier
- **CLI tool**: Interactive migration management
- **Prisma-like DX**: `npm run migrate dev`, `npm run migrate deploy`
- **Advanced seeding**: Full sample data
- **Documentation**: Complete migration guide with examples
- **Rollback support**: Safe migration reversion
- **Migration status**: View applied/pending migrations

---

## Deployment Scripts

### Basic Tier
- ✅ `docker-compose.yml` (development)
- ✅ Basic `Dockerfile`
- ✅ `.env.example`
- ❌ No CI/CD
- ❌ No production configs

### Premium Tier
- ✅ `docker-compose.yml` (development)
- ✅ `docker-compose.prod.yml` (production)
- ✅ Optimized multi-stage `Dockerfile`
- ✅ GitHub Actions workflows (CI/CD)
- ✅ Jenkins pipeline
- ✅ Kubernetes manifests
- ✅ Helm charts
- ✅ Environment templates for all stages

---

## Pricing Justification

### Why Basic is Worth $79

- ✅ Production-ready JWT authentication
- ✅ Password auth with security best practices
- ✅ Basic RBAC (roles + permissions)
- ✅ OAuth with 2 major providers (Google, GitHub)
- ✅ TOTP 2FA
- ✅ Session management
- ✅ TypeORM entities and migrations
- ✅ Docker development environment
- ✅ Core documentation
- **Value**: Saves 2-3 weeks of development time

### Why Premium is Worth $149-$299

- ✅ **Everything in Basic PLUS:**
- ✅ Advanced audit logging (compliance-ready)
- ✅ CASL/ABAC (enterprise authorization)
- ✅ Full API key management system
- ✅ All 4 OAuth providers (+ Microsoft, Apple)
- ✅ SMS + Email 2FA
- ✅ Migration CLI tool (Prisma-like DX)
- ✅ Advanced session tracking & security
- ✅ Production deployment scripts (GitHub Actions, Jenkins, K8s)
- ✅ Frontend integration examples
- ✅ Comprehensive testing suite
- ✅ 6 months of updates
- ✅ Priority support
- **Value**: Saves 4-6 weeks of development time

---

## Building Features: Checklist

Before implementing ANY feature, ask:

- [ ] Which tier includes this feature?
- [ ] Is this a Premium-only feature?
- [ ] Does Basic get a simplified version?
- [ ] Do I need feature flags?
- [ ] Is the code properly tagged (TIER: BASIC/PREMIUM)?
- [ ] Are both tier versions tested?
- [ ] Is documentation updated for the correct tier?

---

## Tier-Specific Environment Variables

### Basic Tier `.env`
```bash
# Basic features only
TIER=basic
ENABLE_AUDIT_LOGS=false
ENABLE_API_KEYS=false
ENABLE_ADVANCED_2FA=false
OAUTH_PROVIDERS=google,github
```

### Premium Tier `.env`
```bash
# All features enabled
TIER=premium
ENABLE_AUDIT_LOGS=true
ENABLE_API_KEYS=true
ENABLE_ADVANCED_2FA=true
OAUTH_PROVIDERS=google,github,microsoft,apple
ENABLE_CASL=true
```

---

## Documentation Strategy

### Basic Tier Docs
- **Scope**: Core features only
- **Depth**: Sufficient to get started
- **Examples**: Basic use cases
- **Guides**: Essential topics only
- **Support**: Community-driven

### Premium Tier Docs
- **Scope**: All features
- **Depth**: Comprehensive and detailed
- **Examples**: Advanced use cases + frontend integrations
- **Guides**: Complete topic coverage
- **Support**: Direct email support + community

---

## Testing Strategy by Tier

### Basic Tier
- ✅ Unit tests for core services
- ❌ No integration tests
- ❌ No E2E tests
- Target: 60% coverage on core features

### Premium Tier
- ✅ Comprehensive unit tests
- ✅ Integration tests for all modules
- ✅ E2E tests for critical flows
- ✅ Coverage reports
- Target: 80%+ coverage

---

## Release Strategy

### Phase 1: Premium Release
1. Build all Premium features (4-6 weeks)
2. Complete Premium documentation
3. Test thoroughly
4. Launch Premium tier first ($149)

### Phase 2: Basic Release
1. Create Basic version by removing Premium features (1 week)
2. Simplify documentation
3. Test Basic tier
4. Launch Basic tier ($79)

### Phase 3: Marketing
1. Show feature comparison
2. Offer upgrade path (Basic → Premium for $70)
3. Limited-time launch discount

---

## Version Control Strategy

```
main/
├── premium/           # Premium branch (full features)
└── basic/            # Basic branch (limited features)
```

Or use tags:
```
v1.0.0-premium
v1.0.0-basic
```

---

## Important Notes

1. **Always reference this document** when starting a new feature
2. **Update this document** when tier requirements change
3. **Mark code clearly** with tier tags
4. **Test both tiers** before release
5. **Document tier differences** in user-facing docs

---

**Last Updated:** 2024-12-20
**Strategy Version:** 1.0.0
**Current Development Phase:** Premium Build (Phase 1)
