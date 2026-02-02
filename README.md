# AuthKit - Production-Ready Authentication Starter Kit

A complete, production-ready authentication system built with **Next.js 15**, **NestJS 11**, and **TypeScript**. Features a professional monochrome design, comprehensive security features, and clean architecture.

## 🚀 Features

### Core Authentication
- ✅ **Email/Password Authentication** - Secure bcrypt hashing with configurable rounds
- ✅ **OAuth Integration** - Google and GitHub sign-in
- ✅ **JWT Tokens** - Access and refresh token rotation
- ✅ **Session Management** - Multi-device session tracking with revocation
- ✅ **Password Reset** - Secure email-based password recovery flow
- ✅ **Email Verification** - User email verification with resend functionality

### Security Features
- ✅ **Two-Factor Authentication (2FA)** - TOTP-based with QR code setup
- ✅ **Backup Codes** - Single-use recovery codes for 2FA
- ✅ **CORS Protection** - Configurable origin whitelist
- ✅ **Helmet.js** - Security headers middleware
- ✅ **Rate Limiting** - Built-in protection against brute force
- ✅ **Input Validation** - Zod schema validation on frontend and backend

### User Experience
- ✅ **Professional UI** - Monochrome design system (black/white/gray)
- ✅ **Responsive Design** - Mobile-first, works on all devices
- ✅ **Loading States** - Smooth transitions and feedback
- ✅ **Toast Notifications** - User-friendly error and success messages
- ✅ **Form Validation** - Real-time validation with helpful error messages

### Developer Experience
- ✅ **TypeScript** - Full type safety across frontend and backend
- ✅ **Monorepo Structure** - pnpm workspace with shared types
- ✅ **Hot Reload** - Fast development with Turbopack (Next.js 15)
- ✅ **API Documentation** - Clear endpoint structure
- ✅ **Type-Safe API Client** - Axios with TypeScript interfaces

## 📁 Project Structure

```
auth-starter-kit/
├── apps/
│   ├── backend/          # NestJS API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/        # Authentication logic
│   │   │   │   ├── users/       # User management
│   │   │   │   ├── sessions/    # Session tracking
│   │   │   │   └── two-factor/  # 2FA implementation
│   │   │   ├── common/          # Shared utilities
│   │   │   └── main.ts          # Application entry
│   │   └── test/
│   └── web/              # Next.js Frontend
│       ├── src/
│       │   ├── app/             # Next.js 15 App Router
│       │   │   ├── auth/        # Auth pages
│       │   │   ├── dashboard/   # Protected dashboard
│       │   │   └── settings/    # User settings
│       │   ├── components/      # React components
│       │   ├── contexts/        # React contexts
│       │   ├── lib/             # Utilities
│       │   └── types/           # TypeScript types
│       └── public/
└── packages/             # Shared packages (future)
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Backend
- **Framework**: NestJS 11
- **Language**: TypeScript 5
- **Database**: PostgreSQL + TypeORM
- **Cache**: Redis
- **Authentication**: Passport.js + JWT
- **Password Hashing**: bcrypt
- **2FA**: speakeasy (TOTP)
- **Validation**: class-validator

## 📦 Installation

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL 14+
- Redis 7+

### Step 1: Clone the Repository
```bash
git clone <your-repo-url>
cd auth-starter-kit
```

### Step 2: Install Dependencies
```bash
pnpm install
```

### Step 3: Configure Environment Variables

#### Backend (.env)
Create `apps/backend/.env`:

```env
# Application
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1
ALLOWED_ORIGINS=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=auth_user
DB_PASSWORD=your_secure_password
DB_DATABASE=auth_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Security
BCRYPT_ROUNDS=10

# OAuth - Google (Get from https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback

# OAuth - GitHub (Get from https://github.com/settings/developers)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/v1/auth/github/callback

# Email Configuration (Nodemailer)
# For development: Leave empty to use Ethereal test account (emails logged to console)
# For production: Configure your SMTP server (Gmail, SendGrid, AWS SES, etc.)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=NEXST Starter Kit <noreply@nexst.dev>

# Frontend URL (for email verification and password reset links)
FRONTEND_URL=http://localhost:3000
```

**Email Service Setup:**

For development, the kit uses [Ethereal Email](https://ethereal.email/) - a fake SMTP service for testing. Emails are not sent but preview URLs are logged to console.

For production, you can use:
- **Gmail**: Enable 2FA and create an App Password
- **SendGrid**: Get API credentials from sendgrid.com
- **AWS SES**: Configure through AWS console
- **Mailgun**: Get credentials from mailgun.com

Example Gmail configuration:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Frontend (.env.local)
Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Step 4: Set Up Database
```bash
# Start PostgreSQL and Redis (with Docker)
docker-compose up -d

# Or install manually and create database
createdb auth_db
```

### Step 5: Run Migrations
```bash
cd apps/backend
pnpm run migration:run
```

### Step 6: Seed Database (Create Super Admin)
```bash
cd apps/backend
pnpm run seed
```

This will create:
- **Roles**: admin, user, moderator
- **Permissions**: admin:read, admin:write, admin:delete, user:read, user:write, session:manage
- **Super Admin Account**:
  - Email: `admin@nexst.dev` (or set via `ADMIN_EMAIL` in .env)
  - Password: `Admin@123456` (or set via `ADMIN_PASSWORD` in .env)

**⚠️ IMPORTANT**: Change the admin password after first login!

### Step 7: Start Development Servers
```bash
# In one terminal - Backend
cd apps/backend
pnpm run start:dev

# In another terminal - Frontend
cd apps/web
pnpm run dev
```

Visit:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **Admin Panel**: http://localhost:3000/admin/login

**Admin Access**:
1. Go to http://localhost:3000/admin/login
2. Login with super admin credentials:
   - Email: `admin@nexst.dev`
   - Password: `Admin@123456`
3. You'll be redirected to the admin dashboard
4. **Change the password immediately** via Settings → Security

**Note on Email Service**:
- In development, check your console for Ethereal preview URLs to view sent emails
- The backend will log: `Preview URL: https://ethereal.email/message/...`
- Click the URL to view the email in your browser

## 🔑 API Endpoints

### Authentication
```
POST   /api/v1/auth/register            - Register new user (sends verification email)
POST   /api/v1/auth/login               - Login with email/password
POST   /api/v1/auth/refresh             - Refresh access token
POST   /api/v1/auth/logout              - Logout current session
POST   /api/v1/auth/verify-email        - Verify email with token (query param)
POST   /api/v1/auth/resend-verification - Resend verification email (authenticated)
POST   /api/v1/auth/forgot-password     - Request password reset email
POST   /api/v1/auth/reset-password      - Reset password with token
PATCH  /api/v1/auth/change-password     - Change password (authenticated)
GET    /api/v1/auth/google              - OAuth Google login
GET    /api/v1/auth/github              - OAuth GitHub login
```

### Users
```
GET    /api/v1/users/me                - Get current user
PATCH  /api/v1/users/profile           - Update user profile
```

### Sessions
```
GET    /api/v1/sessions                - Get all user sessions
DELETE /api/v1/sessions/:id            - Revoke specific session
DELETE /api/v1/sessions/others         - Revoke all other sessions
```

### Two-Factor Authentication
```
GET    /api/v1/2fa/status              - Check 2FA status
POST   /api/v1/2fa/setup               - Generate QR code and secret
POST   /api/v1/2fa/verify              - Verify and enable 2FA
POST   /api/v1/2fa/disable             - Disable 2FA
POST   /api/v1/2fa/validate            - Validate 2FA code during login
```

### OAuth Connected Accounts
```
GET    /api/v1/auth/oauth/accounts     - List connected accounts
DELETE /api/v1/auth/oauth/:provider    - Disconnect OAuth account
```

### Admin Panel (Requires admin:read permission)
```
GET    /api/v1/admin/stats             - Dashboard statistics
GET    /api/v1/admin/users             - List users (paginated, filterable)
GET    /api/v1/admin/users/:id         - Get user details
POST   /api/v1/admin/users/:id/ban     - Ban user account
POST   /api/v1/admin/users/:id/unban   - Unban user account
PATCH  /api/v1/admin/users/:id/roles   - Assign roles to user
DELETE /api/v1/admin/users/:id         - Delete user permanently
GET    /api/v1/admin/sessions          - Get all active sessions
DELETE /api/v1/admin/sessions/:id      - Revoke any session
GET    /api/v1/admin/roles             - List all roles
```

## 🎨 Design System

The UI follows a professional monochrome design system:

### Colors
- **Primary**: Pure black (#000000)
- **Backgrounds**: White (#FFFFFF), Gray-50, Gray-100
- **Text**: Black (headings), Gray-600 (body), Gray-500 (muted)
- **Borders**: `border-black/20` (default), `border-black/40` (active)

### Typography
- **Headings**: Bold, black
- **Body**: Regular, gray-600
- **Font**: System font stack (sans-serif)

### Components
- Subtle borders with opacity
- No colored gradients or AI-looking purples
- Minimal shadows with low opacity
- Clean, modern aesthetic

## 🧪 Testing

### Backend Tests
```bash
cd apps/backend

# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

### Frontend Tests (Coming Soon)
```bash
cd apps/web
pnpm run test
```

## 🚀 Deployment

### Backend Deployment

#### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong JWT secrets (64+ characters)
3. Configure production database
4. Set up SSL/TLS for Redis
5. Enable CORS for your domain

#### Build and Run
```bash
cd apps/backend
pnpm run build
pnpm run start:prod
```

### Frontend Deployment (Vercel)

```bash
cd apps/web
pnpm run build

# Deploy to Vercel
vercel --prod
```

#### Environment Variables
Add these to your Vercel project:
- `NEXT_PUBLIC_API_URL`: Your production API URL

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

## 🔐 Security Best Practices

1. **JWT Secrets**: Generate with `crypto.randomBytes(64).toString('hex')`
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Whitelist only your domains
4. **Rate Limiting**: Configure appropriate limits
5. **Password Policy**: Enforce strong passwords (8+ chars, mixed case, numbers, symbols)
6. **2FA**: Encourage all users to enable 2FA
7. **Session Timeout**: Configure appropriate JWT expiration
8. **Backup Codes**: Users must save backup codes securely

## 📝 Common Issues

### Port Already in Use
```bash
# Kill process on port 3000 or 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Database Connection Failed
- Check PostgreSQL is running
- Verify database credentials in .env
- Ensure database exists

### Redis Connection Failed
- Check Redis is running
- Verify Redis host/port in .env

### CORS Errors
- Ensure `ALLOWED_ORIGINS` includes your frontend URL
- Check credentials are enabled in API client

## 🤝 Contributing

This is a commercial product. Modifications are allowed for your own use.

## 📄 License

Proprietary - For purchaser use only. Not for redistribution.

## 💰 Pricing Tiers

### Basic Tier ($79)
- Complete authentication system
- Email/password + OAuth
- Session management
- Password reset
- Professional UI

### Premium Tier ($149-299) ✓ INCLUDED
- Everything in Basic
- Two-Factor Authentication (2FA)
- Backup codes
- Email verification
- Advanced session tracking
- Complete source code
- Production-ready

## 🎯 Roadmap

- [ ] Email templates customization
- [ ] Admin dashboard
- [ ] User roles and permissions (RBAC)
- [ ] Audit logs
- [ ] API rate limiting dashboard
- [ ] WebAuthn/Passkey support
- [ ] Social login (Twitter, LinkedIn)
- [ ] Magic link authentication

## 📧 Support

For support and questions:
- Email: support@yourcompany.com
- Documentation: https://docs.yourcompany.com
- GitHub Issues: For bug reports only

---

**Version:** 1.0.0 (Premium Tier)
**Last Updated:** 2026-02-02
Built with ❤️ using Next.js and NestJS
