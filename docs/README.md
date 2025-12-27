# Auth Starter Kit - Documentation

A production-ready, modular authentication and authorization system built with NestJS, TypeORM, PostgreSQL, and Redis.

## Table of Contents

- [Getting Started](#getting-started)
- [Documentation Index](#documentation-index)
- [Quick Links](#quick-links)

## Getting Started

1. **[Installation Guide](./guides/getting-started.md)** - Set up the project locally
2. **[Configuration](./CONFIGURATION.md)** - Environment variables and settings
3. **[Database Schema](./DATABASE.md)** - Complete database reference
4. **[Architecture](./ARCHITECTURE.md)** - System design and module structure

## Documentation Index

### Core Documentation
- **[Database Schema](./DATABASE.md)** - Complete entity reference and relationships
- **[Architecture](./ARCHITECTURE.md)** - System overview and design patterns
- **[API Reference](./API.md)** - REST API endpoints (auto-generated)
- **[Configuration](./CONFIGURATION.md)** - Environment setup and customization
- **[Deployment](./DEPLOYMENT.md)** - Production deployment guide

### Schema Documentation
- **[Entity Relationship Diagrams](./schema/entity-relationship.md)**
- **Individual Entities:**
  - [User Entity](./schema/entities/user.md)
  - [Role Entity](./schema/entities/role.md)
  - [Permission Entity](./schema/entities/permission.md)
  - [Session Entity](./schema/entities/session.md)
  - [OAuth Entity](./schema/entities/oauth.md)
  - [Two-Factor Entity](./schema/entities/two-factor.md)
  - [API Key Entity](./schema/entities/api-key.md)

### Implementation Guides
- **[Getting Started](./guides/getting-started.md)** - Quick start guide
- **[JWT Configuration](./guides/jwt-configuration.md)** - JWT setup and customization
- **[OAuth Setup](./guides/oauth-setup.md)** - Social login integration
- **[RBAC Customization](./guides/rbac-customization.md)** - Role-based access control
- **[Security Best Practices](./guides/security-best-practices.md)** - Security guidelines
- **[Testing Guide](./guides/testing.md)** - Unit and E2E testing

### Examples
- **[Custom Guards](./examples/custom-guards.md)** - Creating custom authorization guards
- **[Extending Entities](./examples/extending-entities.md)** - Adding custom fields
- **[Custom Permissions](./examples/custom-permissions.md)** - Implementing custom permissions

## Quick Links

### For Developers
- [Database Migrations](./schema/migrations.md)
- [Testing Guide](./guides/testing.md)
- [API Documentation](./API.md)

### For DevOps
- [Deployment Guide](./DEPLOYMENT.md)
- [Environment Configuration](./CONFIGURATION.md)
- [Docker Setup](./DEPLOYMENT.md#docker)

### For Customization
- [Extending Entities](./examples/extending-entities.md)
- [Custom Guards](./examples/custom-guards.md)
- [RBAC Customization](./guides/rbac-customization.md)

## Features Overview

### Authentication
- ✅ JWT-based authentication (Access + Refresh tokens)
- ✅ Password authentication with Argon2/Bcrypt
- ✅ OAuth 2.0 (Google, GitHub, Microsoft, Apple)
- ✅ Two-Factor Authentication (TOTP, SMS, Email)
- ✅ Session management with device tracking
- ✅ Account lockout and brute-force protection

### Authorization
- ✅ Role-Based Access Control (RBAC)
- ✅ Hierarchical roles
- ✅ Granular permissions
- ✅ API key management
- ✅ CASL integration for ABAC (Attribute-Based Access Control)

### Security
- ✅ Password history tracking
- ✅ Rate limiting
- ✅ Audit logging
- ✅ IP whitelisting/blacklisting
- ✅ Trusted device management
- ✅ Security headers (Helmet)

### Developer Experience
- ✅ Fully typed with TypeScript
- ✅ Comprehensive documentation
- ✅ Unit and E2E tests
- ✅ Docker support
- ✅ Migration system
- ✅ Seeding system

## Tech Stack

- **Framework:** NestJS 11.x
- **ORM:** TypeORM
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Language:** TypeScript 5.x
- **Authentication:** Passport.js, JWT
- **Validation:** class-validator, class-transformer

## Support

For questions, issues, or feature requests:
- Check the [guides](./guides/) directory
- Review [examples](./examples/) for common use cases
- Consult [schema documentation](./schema/) for database questions

## License

MIT License

---

**Version:** 1.0.0
**Last Updated:** 2024-12-20
