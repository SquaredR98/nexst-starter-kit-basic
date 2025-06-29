# ERP System - Development Guide

## 🚀 Quick Start

### 1. Initial Setup
```bash
# Run the automated setup script
npm run setup

# Or manually:
cp env.example .env
npm install
npm run db:generate
```

### 2. Environment Configuration
Update the `.env` file with your database URLs and secrets:

```env
# Minimum required for development:
CENTRAL_DATABASE_URL="postgresql://username:password@localhost:5432/erp_central"
TENANT_DATABASE_URL="postgresql://username:password@localhost:5432/tenant_template"
NEXTAUTH_SECRET="your-secret-here"
TENANT_ENCRYPTION_KEY="your-32-character-secret-key-here"
```

### 3. Start Development
```bash
npm run dev
```

## 🎨 Theme System

### Demo
Visit `http://localhost:3000/theme-demo` to see the theme system in action.

### Key Components
- **ThemeProvider**: Global theme management
- **Theme APIs**: `/api/tenant/theme` and `/api/tenant/customization`
- **UI Components**: Button, Card, Input with theme support
- **CSS Variables**: HSL-based theming system

### Preset Themes
- Default (Blue)
- Dark
- Ocean Blue
- Forest Green
- Royal Purple
- Corporate
- Minimal

## 📁 Project Structure

```
src/
├── app/
│   ├── api/tenant/          # Tenant-specific APIs
│   ├── theme-demo/          # Theme showcase page
│   ├── globals.css          # Theme CSS variables
│   └── layout.tsx           # Root layout with providers
├── components/ui/           # Reusable UI components
├── lib/
│   ├── theme/              # Theme utilities
│   └── database/           # Database connection managers
├── providers/              # React context providers
└── types/                  # TypeScript definitions

prisma/schemas/
├── central.prisma          # Platform database schema
└── tenant.prisma           # Tenant database schema
```

## 🛠 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:clean` | Clean start with CSS rebuild |
| `npm run setup` | Automated development setup |
| `npm run db:generate` | Generate both Prisma clients |
| `npm run db:studio:central` | Open central DB in Prisma Studio |
| `npm run db:studio:tenant` | Open tenant DB in Prisma Studio |
| `npm run validate` | Run linting and generate clients |

## 🔧 Common Issues & Solutions

### 1. Prisma Client Not Found
```bash
# Solution: Generate clients
npm run db:generate
```

### 2. CSS Classes Not Working
- Check `src/app/globals.css` for theme variables
- Verify ThemeProvider is wrapped in layout
- Ensure CSS utilities are properly defined

### 3. Environment Variables Missing
```bash
# Solution: Copy and configure environment
cp env.example .env
# Then edit .env with your settings
```

## 🏗 Architecture

### Database Architecture
- **Central Database**: Platform management, tenant registry
- **Tenant Databases**: Per-tenant business data
- **Dual Schema**: Separate Prisma schemas for isolation

### Theme System Architecture
1. **CSS Variables**: HSL-based color system
2. **React Context**: ThemeProvider manages state
3. **API Layer**: RESTful theme management
4. **Component Library**: Theme-aware UI components

### Customization Levels
- **Platform**: Global defaults and presets
- **Tenant**: Organization-specific themes
- **User**: Personal preferences (future)

## 🎯 Development Workflow

1. **Setup**: Run `npm run setup`
2. **Database**: Configure database URLs in `.env`
3. **Development**: Use `npm run dev` for hot reload
4. **Testing**: Visit `/theme-demo` for UI testing
5. **API Testing**: Use tenant APIs for data management

## 📚 Key Features

### Phase 4A Implementation ✅
- [x] Theme System with 7 presets
- [x] CSS Variable-based theming
- [x] ThemeProvider with React Context
- [x] UI Component Library (Button, Card, Input)
- [x] Theme APIs with validation
- [x] Database schema for customization
- [x] Development tooling and automation

### Next Phases 🚧
- [ ] Dashboard Widget System
- [ ] Custom Fields Engine
- [ ] Workflow Builder
- [ ] Advanced UI Components
- [ ] Multi-language Support

## 🐛 Troubleshooting

### Build Errors
1. Run `npm run validate` to check setup
2. Ensure all environment variables are set
3. Check database connectivity

### Theme Issues
1. Verify CSS variables in browser dev tools
2. Check ThemeProvider wrapper in layout
3. Ensure API endpoints are accessible

### Database Issues
1. Check database URLs in `.env`
2. Verify database servers are running
3. Run `npm run db:generate` to refresh clients

## 🤝 Contributing

1. Follow the established project structure
2. Use the theme system for all UI components
3. Add TypeScript types for new features
4. Update this guide for new development patterns

## 📞 Support

For development issues:
1. Check this guide first
2. Verify environment setup with `npm run setup`
3. Check console for detailed error messages
4. Review the demo page for working examples 