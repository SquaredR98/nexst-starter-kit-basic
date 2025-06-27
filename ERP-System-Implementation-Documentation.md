# ERP System Implementation Documentation

## Project Overview

Building a robust, modular ERP system that serves as both a complete ERP solution and an API service platform. The system supports both SaaS deployment and packaged executable distribution.

### Key Objectives
- **Modular Design:** Each department/module is a separate, pluggable component
- **Extensibility:** Support for both built-in and third-party integrations
- **Granular Permissions:** Role-based, screen-level, and column-level access control
- **Feature Packaging:** Core features free; advanced features unlockable via licensing
- **Multi-tenancy:** Support multiple organizations/clients in a single deployment
- **API-first:** All features accessible via REST APIs

## Architecture Decisions

### 1. Monorepo Structure
```
erp-system/
├── backend/          # NestJS backend with TypeORM
├── web/             # Web frontend (future)
├── app/             # Mobile app (future)
└── desktop/         # Desktop app (future)
```

### 2. Database Architecture
- **Approach:** Single database with tenant table (tenant_id in all tables)
- **Alternative Considered:** Database-per-tenant (rejected for complexity)
- **Database:** PostgreSQL with TypeORM
- **Pattern:** Repository pattern for all database operations

### 3. Backend Structure
```
backend/src/
├── database/
│   ├── entities/           # TypeORM entities by feature
│   │   ├── user/
│   │   │   ├── entity.ts
│   │   │   └── repository.ts
│   │   ├── tenant/
│   │   ├── profile/
│   │   ├── employee-details/
│   │   ├── address/
│   │   ├── country/
│   │   ├── state/
│   │   ├── city/
│   │   └── pincode/
│   └── database.module.ts
└── modules/
    ├── user/
    │   ├── user.controller.ts
    │   ├── user.service.ts
    │   └── dto/
    ├── tenant/
    ├── profile/
    ├── employee-details/
    ├── address/
    ├── country/
    ├── state/
    ├── city/
    └── pincode/
```

### 4. Layered Architecture
- **Controller** → **Service** → **Repository** → **Entity**
- **Entities** only used in:
  - Other entities (for relationships)
  - Their own repository
- **No direct entity access** from services or controllers

## Database Schema Design

### Core Tables

#### 1. Tenants
- `id` (PK)
- `uuid` (unique identifier)
- `name` (company name)
- `code` (unique code)
- `email`, `phone`, `address`
- `status` (ACTIVE, SUSPENDED, DELETED)
- `plan` (subscription plan)
- `settings` (JSONB for flexible config)
- `created_at`, `updated_at`, `deleted_at`

#### 2. Users
- `id` (PK)
- `uuid` (unique identifier)
- `user_id` (custom user code per tenant)
- `tenant_id` (FK to tenants)
- `user_type` (CUSTOMER, VENDOR, EMPLOYEE, ADMIN, SUPER_ADMIN)
- `password`, `email`, `phone`
- `oauth_provider`, `oauth_id`, `refresh_token`
- `status` (ACTIVE, INACTIVE, SUSPENDED, DELETED)
- `last_login`
- `created_at`, `updated_at`, `deleted_at`

#### 3. Profiles
- `id` (PK)
- `user_id` (FK to users, one-to-one)
- `tenant_id` (FK to tenants)
- `name`, `display_name`, `gender`, `dob`
- `avatar_url`
- `employee_number`, `customer_code`, `vendor_code`
- `extra` (JSONB for flexible data)
- `created_at`, `updated_at`, `deleted_at`

#### 4. Employee Details
- `id` (PK)
- `profile_id` (FK to profiles, one-to-one)
- `salary_structure` (JSONB)
- `department`, `designation`
- `joining_date`
- `created_at`, `updated_at`

#### 5. Address System (Normalized)
- **Countries:** `id`, `name`, `iso_code`
- **States:** `id`, `name`, `code`, `country_id`
- **Cities:** `id`, `name`, `state_id`, `country_id`
- **Pincodes:** `id`, `code`, `city_id`, `state_id`, `country_id`
- **Addresses:** `id`, `profile_id`, `type` (HOME, WORK, BILLING, SHIPPING), `line1`, `line2`, `city_id`, `state_id`, `country_id`, `pincode_id`

## Implementation Status

### ✅ Completed

#### 1. Project Setup
- NestJS backend initialized
- TypeORM configured with PostgreSQL
- Migration system set up
- Repository pattern implemented

#### 2. Database Entities
- ✅ Tenant entity with relationships
- ✅ User entity with enums and relationships
- ✅ Profile entity with relationships
- ✅ EmployeeDetails entity with relationships
- ✅ Country, State, City, Pincode entities with relationships
- ✅ Address entity with enum types

#### 3. Repositories
- ✅ All entities have corresponding repositories
- ✅ Custom repository pattern (no deprecated @EntityRepository)
- ✅ Proper dependency injection setup

#### 4. Modules (Controllers, Services, DTOs)
- ✅ User module with CRUD operations
- ✅ Tenant module with CRUD operations
- ✅ Profile module with CRUD operations
- ✅ EmployeeDetails module with CRUD operations
- ✅ Address module with CRUD operations
- ✅ Country, State, City, Pincode modules with CRUD operations

#### 5. DTOs
- ✅ Create and Update DTOs for all modules
- ✅ Proper validation and type safety
- ✅ Enum imports for type safety

### 🔄 In Progress
- Database migration generation
- Main app module configuration
- Testing setup

### 📋 Next Steps
1. Generate and run database migrations
2. Set up main app module with all feature modules
3. Test basic CRUD operations
4. Add authentication and authorization
5. Implement tenant isolation middleware
6. Add more business modules (CRM, Inventory, Finance, etc.)

## Technical Decisions

### 1. TypeORM Configuration
- **Database:** PostgreSQL
- **Synchronize:** true (development), false (production)
- **Entities:** Auto-loaded from entities directory
- **Migrations:** Configured with proper scripts

### 2. Repository Pattern
- **Custom repositories** extending TypeORM Repository
- **No deprecated @EntityRepository decorator**
- **Proper dependency injection** with @Inject tokens
- **Module-level registration** of repositories

### 3. Multi-tenancy
- **Single database approach** with tenant_id columns
- **Tenant isolation** to be implemented in middleware
- **Flexible for both SaaS and on-premise** deployments

### 4. Data Normalization
- **Address system fully normalized** (Country → State → City → Pincode)
- **JSONB fields** for flexible data storage
- **Proper foreign key relationships**

## Business Requirements Addressed

### 1. Modular ERP System ✅
- Each module is separate and pluggable
- Easy to add new features/modules
- Clean separation of concerns

### 2. Multi-tenant Support ✅
- Tenant table and relationships established
- Ready for tenant isolation implementation
- Supports both SaaS and packaged deployment

### 3. Granular Permissions (Planned)
- Role-based access control structure ready
- Screen and column-level permissions to be implemented
- User types and status enums defined

### 4. API-First Design ✅
- All business logic exposed via REST APIs
- Clean controller-service-repository structure
- Ready for API documentation and SDK generation

### 5. Feature Packaging (Planned)
- Tenant plan field ready for subscription management
- Settings JSONB field for feature toggles
- License management to be implemented

## USP Strategy

### 1. API Selling
- **Current:** All endpoints ready for API documentation
- **Future:** Swagger/OpenAPI, SDK libraries, rate limiting

### 2. Tally User Transition
- **Current:** Simple, normalized database structure
- **Future:** Import tools, familiar terminology, keyboard shortcuts

### 3. Competitive Advantages
- **Modern tech stack:** NestJS, TypeORM, PostgreSQL
- **Extensible architecture:** Plugin system ready
- **Hybrid deployment:** SaaS + packaged options

## File Structure Summary

```
backend/
├── src/
│   ├── database/
│   │   ├── database.module.ts
│   │   └── entities/
│   │       ├── user/entity.ts, repository.ts
│   │       ├── tenant/entity.ts, repository.ts
│   │       ├── profile/entity.ts, repository.ts
│   │       ├── employee-details/entity.ts, repository.ts
│   │       ├── address/entity.ts, repository.ts
│   │       ├── country/entity.ts, repository.ts
│   │       ├── state/entity.ts, repository.ts
│   │       ├── city/entity.ts, repository.ts
│   │       └── pincode/entity.ts, repository.ts
│   └── modules/
│       ├── user/controller.ts, service.ts, dto/
│       ├── tenant/controller.ts, service.ts, dto/
│       ├── profile/controller.ts, service.ts, dto/
│       ├── employee-details/controller.ts, service.ts, dto/
│       ├── address/controller.ts, service.ts, dto/
│       ├── country/controller.ts, service.ts, dto/
│       ├── state/controller.ts, service.ts, dto/
│       ├── city/controller.ts, service.ts, dto/
│       └── pincode/controller.ts, service.ts, dto/
├── ormconfig.ts
└── package.json (with migration scripts)
```

## Dependencies Installed
- `@nestjs/typeorm`
- `typeorm`
- `pg` (PostgreSQL driver)
- `reflect-metadata`
- `ts-node`
- `tsconfig-paths`

## Migration Scripts Available
- `npm run migration:generate` - Generate new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration
- `npm run migration:show` - Show migration status

---

**Last Updated:** [Current Date]
**Status:** MVP Backend Scaffolding Complete
**Next Milestone:** Database Migration and Testing 