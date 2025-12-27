# Getting Started Guide

Quick start guide to set up and run the Auth Starter Kit locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **Git** ([Download](https://git-scm.com/))

### Verify Installations

```bash
node --version    # Should show v18.x or higher
npm --version     # Should show 9.x or higher
docker --version  # Should show Docker version
git --version     # Should show Git version
```

---

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd auth-starter-kit
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- NestJS framework
- TypeORM and PostgreSQL driver
- Redis client (ioredis)
- Authentication libraries (Passport, JWT)
- Validation libraries
- Security packages

### Step 3: Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```bash
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=4000
DB_USERNAME=auth_user
DB_PASSWORD=secure_password
DB_DATABASE=auth_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (Generate secure secrets - see below)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Security
BCRYPT_ROUNDS=10
```

**Generate Secure JWT Secrets:**

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```

### Step 4: Start Docker Services

Start PostgreSQL and Redis containers:

```bash
docker-compose up -d
```

Verify services are running:

```bash
docker-compose ps
```

You should see:
```
NAME              STATUS    PORTS
auth_postgres     Up        0.0.0.0:4000->5432/tcp
auth_redis        Up        0.0.0.0:6379->6379/tcp
```

### Step 5: Run Database Migrations

```bash
# Build the project first
npm run build

# Run migrations
npm run migration:run
```

### Step 6: Seed Initial Data (Optional)

```bash
npm run seed
```

This will create:
- Default roles (super_admin, admin, user)
- Default permissions
- Sample user accounts (for development only)

### Step 7: Start the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

You should see:

```
🚀 Application is running on: http://localhost:3000/api/v1
📚 Environment: development
```

---

## Verify Installation

### Test Health Endpoint

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### Test Database Connection

```bash
docker exec -it auth_postgres psql -U auth_user -d auth_db -c "\dt"
```

You should see a list of tables:
```
 public | users
 public | profiles
 public | roles
 public | permissions
 ...
```

### Test Redis Connection

```bash
docker exec -it auth_redis redis-cli ping
```

Expected response: `PONG`

---

## Common Tasks

### Starting Development

```bash
# Start Docker services
docker-compose up -d

# Start application in watch mode
npm run start:dev
```

### Stopping Services

```bash
# Stop application (Ctrl+C in terminal)

# Stop Docker services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

### Viewing Logs

```bash
# Application logs (in terminal running npm run start:dev)

# Docker service logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Database Operations

```bash
# Create new migration
npm run migration:create -- src/database/migrations/MigrationName

# Generate migration from entity changes
npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

---

## Project Structure Overview

```
auth-starter-kit/
├── src/
│   ├── main.ts                  # Application entry point
│   ├── app.module.ts           # Root module
│   ├── config/                 # Configuration files
│   ├── database/               # Entities, migrations, seeds
│   ├── modules/                # Feature modules
│   │   ├── auth/              # Authentication
│   │   ├── rbac/              # Authorization
│   │   ├── users/             # User management
│   │   └── ...
│   └── common/                 # Shared utilities
├── test/                       # Test files
├── docs/                       # Documentation
├── docker-compose.yml          # Docker services
├── .env                        # Environment variables
└── package.json               # Dependencies
```

---

## Next Steps

### 1. Explore the API

- **Swagger Documentation:** http://localhost:3000/api/docs (coming soon)
- **Postman Collection:** Import from `docs/postman/` (coming soon)

### 2. Review Core Concepts

- [Architecture Overview](../ARCHITECTURE.md)
- [Database Schema](../DATABASE.md)
- [Configuration Guide](../CONFIGURATION.md)

### 3. Implement Features

- [JWT Configuration](./jwt-configuration.md)
- [OAuth Setup](./oauth-setup.md)
- [RBAC Customization](./rbac-customization.md)
- [Security Best Practices](./security-best-practices.md)

### 4. Customize for Your Needs

- [Extending Entities](../examples/extending-entities.md)
- [Custom Guards](../examples/custom-guards.md)
- [Custom Permissions](../examples/custom-permissions.md)

---

## Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000        # macOS/Linux
netstat -ano | findstr :3000   # Windows

# Kill the process or change PORT in .env
PORT=3001
```

### Docker Connection Failed

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
1. Ensure Docker Desktop is running
2. Restart Docker Desktop
3. Check Docker status: `docker info`

### Database Connection Refused

**Error:** `ECONNREFUSED localhost:4000`

**Solution:**
1. Check Docker container is running: `docker-compose ps`
2. Verify credentials in `.env` match `docker-compose.yml`
3. Restart Docker services: `docker-compose restart postgres`

### Migration Failed

**Error:** `QueryFailedError: relation "users" already exists`

**Solution:**
```bash
# Check current migrations
npm run typeorm -- migration:show

# Revert last migration
npm run migration:revert

# Clean database (⚠️ destroys all data)
docker-compose down -v
docker-compose up -d
npm run migration:run
```

### Redis Connection Error

**Error:** `Redis connection to localhost:6379 failed`

**Solution:**
```bash
# Restart Redis container
docker-compose restart redis

# Check Redis is responding
docker exec -it auth_redis redis-cli ping
```

### Environment Validation Failed

**Error:** `An instance of EnvironmentVariables has failed the validation`

**Solution:**
1. Check all required variables are set in `.env`
2. Verify variable types (numbers vs strings)
3. Check for typos in variable names
4. Review [Configuration Guide](../CONFIGURATION.md)

---

## Development Workflow

### Daily Development

```bash
# 1. Start Docker services
docker-compose up -d

# 2. Start application
npm run start:dev

# 3. Make changes (hot reload enabled)

# 4. Run tests
npm test

# 5. Format code before commit
npm run format
npm run lint

# 6. Commit changes
git add .
git commit -m "feat: your feature"
```

### Creating New Features

```bash
# 1. Create new branch
git checkout -b feature/your-feature

# 2. Generate module
nest generate module modules/your-feature
nest generate service modules/your-feature
nest generate controller modules/your-feature

# 3. Create entity
# Edit src/database/entities/your-entity.entity.ts

# 4. Generate migration
npm run migration:generate -- src/database/migrations/AddYourEntity

# 5. Run migration
npm run migration:run

# 6. Test your changes
npm test

# 7. Commit and push
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

---

## Getting Help

### Documentation
- [Main Documentation Hub](../README.md)
- [Architecture Guide](../ARCHITECTURE.md)
- [Database Schema](../DATABASE.md)
- [API Reference](../API.md)

### Community
- GitHub Issues: [Report bugs or request features]
- Discussions: [Ask questions]

### Common Questions

**Q: Can I use MySQL instead of PostgreSQL?**
A: Yes, update `database.config.ts` and change the driver in `package.json`.

**Q: How do I deploy to production?**
A: See [Deployment Guide](../DEPLOYMENT.md) for detailed instructions.

**Q: Can I customize the authentication flow?**
A: Yes! Review the [JWT Configuration](./jwt-configuration.md) and [RBAC Customization](./rbac-customization.md) guides.

**Q: Where are the API endpoints documented?**
A: Swagger documentation will be available at `/api/docs` (coming in Phase 2).

---

## What's Next?

You're now ready to start building with the Auth Starter Kit!

**Recommended Learning Path:**

1. ✅ Complete installation (you are here)
2. 📚 Review [Architecture](../ARCHITECTURE.md) to understand the system
3. 🗄️ Study [Database Schema](../DATABASE.md) to understand data models
4. 🔐 Implement [JWT Authentication](./jwt-configuration.md)
5. 👥 Setup [RBAC](./rbac-customization.md) for your use case
6. 🔒 Review [Security Best Practices](./security-best-practices.md)
7. 🚀 Deploy using [Deployment Guide](../DEPLOYMENT.md)

Happy coding!

---

**Last Updated:** 2024-12-20
**Guide Version:** 1.0.0
