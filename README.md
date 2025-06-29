# Multi-Tenant ERP System with GST Compliance

## Project Overview

A comprehensive **multi-tenant Enterprise Resource Planning (ERP) system** designed specifically for **Indian businesses** with full **GST compliance**, supporting **multi-state operations** and **tenant-per-database architecture**. The system features advanced **theme customization**, **typography management**, and **state-based access control**.

## Table of Contents

- [Project Evolution](#project-evolution)
- [Architectural Decisions](#architectural-decisions)
- [Database Architecture](#database-architecture)
- [Core Features](#core-features)
- [Theme & Font System](#theme--font-system)
- [Development Setup](#development-setup)
- [API Documentation](#api-documentation)
- [Technology Stack](#technology-stack)
- [Development Phases](#development-phases)
- [Current Status](#current-status)
- [Future Roadmap](#future-roadmap)

## Project Evolution

### Initial Requirements
- **Multi-tenant ERP system** for Indian businesses
- **GST compliance** with support for all GST return types (GSTR-1, GSTR-2, GSTR-3B)
- **Multi-state operations** with state-specific GST handling
- **Sub-tenant support** for GST compliance per state
- **Scalable architecture** supporting thousands of tenants

### Key Architectural Decisions Made

#### 1. **Tenant-Per-Database vs Shared Database**
**Decision**: Chose **tenant-per-database architecture**
**Reasoning**: 
- Better data isolation and security
- Easier compliance with Indian data protection requirements
- Independent scaling per tenant
- Simplified backup and restore operations
- Better performance for large tenants

#### 2. **State Management Within Tenant DB vs Separate Databases**
**Decision**: **State management within tenant database** rather than separate databases per state
**Reasoning**:
- Simplified architecture and maintenance
- Cost-effective for smaller businesses
- State-restricted users vs tenant admins approach
- Easier transaction handling across states

#### 3. **Access Control Model**
**Decision**: **State-based access control** with two user types:
- **State-restricted users**: Limited to specific state operations
- **Tenant admins**: Company-wide access across all states

#### 4. **Theme System Approach**
**Decision**: **CSS-first approach** with CSS modules instead of complex Tailwind configurations
**Reasoning**:
- Simpler maintenance and debugging
- Better compatibility with different Tailwind versions
- More predictable behavior
- Easier customization for tenants

## Architectural Decisions

### Database Architecture

#### **Dual Database Design**

```
┌─────────────────┐    ┌─────────────────┐
│  Central DB     │    │   Tenant DBs    │
│  ─────────────  │    │  ─────────────  │
│  • Tenants      │◄──►│  • Organizations│
│  • Subscriptions│    │  • Users        │
│  • Billing      │    │  • Customers    │
│  • GST Ref Data │    │  • Transactions │
│  • API Keys     │    │  • GST Returns  │
│  • Audit Logs   │    │  • Audit Logs   │
└─────────────────┘    └─────────────────┘
```

#### **Central Database (Platform Management)**
- **Platform Tenants**: Organization registry with encrypted database credentials
- **Subscription Management**: Billing, license tracking
- **GST Reference Data**: Countries, states, cities, GST rates
- **Cross-tenant Audit Logging**: Platform-level security events
- **API Key Management**: Platform access control

#### **Tenant Databases (Business Operations)**
- **Organization with State Branches**: Multi-state business support
- **Enhanced User Management**: State-based access control
- **Complete Business Entities**: Customers, suppliers, products, inventory
- **Transaction Management**: Sales/purchase with GST calculations
- **GST Compliance System**: Return filing and compliance tracking
- **Comprehensive Audit Logging**: Business operation tracking

### Security Architecture

#### **Encryption & Data Protection**
- **AES-256-GCM encryption** for tenant database credentials
- **Encrypted credential storage** in central database
- **Connection pooling** with health monitoring
- **JWT-based authentication** with tenant context

#### **Access Control**
- **ABAC (Attribute-Based Access Control)** implementation
- **State-based user restrictions**
- **Role-based permissions** within organizations
- **API key authentication** for platform operations

### GST Compliance Architecture

#### **GST Calculation Engine**
```typescript
// Supports both intrastate and interstate transactions
class GSTCalculationEngine {
  calculateIntrastate(amount, gstRate) {
    // CGST + SGST calculation
    const cgst = amount * (gstRate / 2) / 100;
    const sgst = amount * (gstRate / 2) / 100;
    return { cgst, sgst, total: amount + cgst + sgst };
  }

  calculateInterstate(amount, gstRate) {
    // IGST calculation
    const igst = amount * gstRate / 100;
    return { igst, total: amount + igst };
  }
}
```

#### **Return Filing System**
- **GSTR-1**: Outward supplies
- **GSTR-2**: Inward supplies
- **GSTR-3B**: Monthly returns
- **Automatic data compilation** from transactions
- **B2B/B2C supply categorization**

## Core Features

### 1. **Multi-Tenant Infrastructure**
- **Dynamic database connections** with encrypted credentials
- **Tenant onboarding** with automatic database setup
- **Cross-database synchronization** for platform operations
- **Health monitoring** and connection management

### 2. **GST Compliance Suite**
- **Real-time GST calculations** for all transaction types
- **State-wise GST handling** (intrastate vs interstate)
- **Automated return generation** from transaction data
- **GST number validation** and verification
- **Compliance reporting** and audit trails

### 3. **State-Based Operations**
- **Multi-state branch management** within single tenant
- **State-restricted user access** for compliance
- **Interstate transaction handling** with proper GST application
- **State-specific reporting** and analytics

### 4. **Business Entity Management**
- **Customer/Supplier management** with GST validation
- **Product catalog** with HSN/SAC codes
- **Inventory management** across multiple states
- **Transaction processing** with integrated GST calculation

## Theme & Font System

### **Architecture Decision: CSS-First Approach**

#### **Problem Solved**
- Complex Tailwind CSS v4 configuration conflicts
- Unpredictable utility class behavior
- Maintenance difficulties with theme variables

#### **Solution Implemented**
- **CSS Modules** for component styling
- **CSS Custom Properties** for theme variables
- **Direct CSS approach** for reliable theming

### **Font System Features**

#### **Google Fonts Integration**
```typescript
// 8 Professional fonts loaded via Next.js optimization
const fonts = {
  sansSerif: ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins'],
  serif: ['Playfair Display', 'Merriweather', 'Crimson Text']
};
```

#### **Typography Management**
- **Primary Font**: Interface elements (buttons, navigation)
- **Heading Font**: Titles and section headers
- **Body Font**: Content and paragraphs
- **Live preview** with instant updates
- **Persistent preferences** via localStorage

#### **State Management**
```typescript
// React Context for SSR compatibility
const FontContext = createContext<FontContextType>();

// No Redux to maintain server-side rendering
export function FontProvider({ children }) {
  const [primaryFont, setPrimaryFont] = useState('inter');
  // ... font management logic
}
```

### **Theme System Architecture**

#### **CSS Variable System**
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 84% 5%;
  --primary: 222 84% 55%;
  /* ... theme variables */
  
  --font-primary: var(--font-inter);
  --font-heading: var(--font-inter);
  --font-body: var(--font-inter);
}
```

#### **Component Styling Strategy**
```css
/* CSS Modules approach for reliability */
.button {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  font-family: var(--font-primary);
}
```

#### **Preset Themes Available**
1. **Default** - Modern blue theme
2. **Dark** - Dark mode variant
3. **Ocean Blue** - Professional blue
4. **Forest Green** - Nature-inspired green
5. **Royal Purple** - Elegant purple
6. **Corporate** - Conservative business theme
7. **Minimal** - Clean, minimal design

## Development Setup

### **Prerequisites**
```bash
Node.js >= 18.0.0
PostgreSQL >= 14.0
npm or yarn package manager
```

### **Environment Configuration**
```bash
# Copy environment template
cp env.example .env

# Required environment variables
CENTRAL_DATABASE_URL="postgresql://user:pass@localhost:5432/erp_central"
TENANT_DATABASE_URL="postgresql://user:pass@localhost:5432/tenant_template"
TENANT_ENCRYPTION_KEY="your-32-character-secret-key"
NEXTAUTH_SECRET="your-nextauth-secret"
```

### **Installation & Setup**
```bash
# Automated setup (recommended)
npm run setup

# Manual setup
npm install
npm run db:generate
npm run dev
```

### **Available Scripts**
| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with auto-setup |
| `npm run setup` | Automated development environment setup |
| `npm run db:generate` | Generate both Prisma clients |
| `npm run db:studio:central` | Open central database in Prisma Studio |
| `npm run db:studio:tenant` | Open tenant database in Prisma Studio |
| `npm run validate` | Run linting and generate clients |

### **Demo Pages**
- **Theme Demo**: `http://localhost:3000/theme-demo`
- **Font System**: Integrated in theme demo
- **Main Dashboard**: `http://localhost:3000/dashboard`

## API Documentation

### **Platform Management APIs**

#### **Tenant Registration**
```typescript
POST /api/platform/tenants
{
  "organizationName": "ABC Corp",
  "contactEmail": "admin@abc.com",
  "databaseConfig": {
    "host": "localhost",
    "port": 5432,
    "database": "abc_corp_db",
    "username": "abc_user",
    "password": "secure_password"
  }
}
```

#### **Tenant Management**
```typescript
GET /api/platform/tenants/[tenantId]
PUT /api/platform/tenants/[tenantId]
DELETE /api/platform/tenants/[tenantId]
```

### **Business Operations APIs**

#### **Customer Management**
```typescript
GET /api/tenant/customers
POST /api/tenant/customers
{
  "name": "Customer Name",
  "gstNumber": "22ABCDE1234F1Z5",
  "address": {
    "state": "MAHARASHTRA",
    "pincode": "400001"
  }
}
```

#### **Transaction Processing**
```typescript
POST /api/tenant/transactions
{
  "type": "SALE",
  "customerId": "customer-id",
  "items": [
    {
      "productId": "product-id",
      "quantity": 10,
      "unitPrice": 100,
      "gstRate": 18
    }
  ]
}
```

### **GST Compliance APIs**

#### **GST Returns**
```typescript
GET /api/tenant/gst/returns?type=GSTR1&month=2024-01
POST /api/tenant/gst/returns
{
  "returnType": "GSTR1",
  "period": "2024-01",
  "generateFromTransactions": true
}
```

### **Theme & Customization APIs**

#### **Theme Management**
```typescript
GET /api/tenant/theme
PUT /api/tenant/theme
{
  "themeName": "Custom Corporate",
  "colors": {
    "primary": "hsl(215, 25%, 27%)",
    "secondary": "hsl(215, 25%, 85%)"
  }
}
```

## Technology Stack

### **Backend Technologies**
- **Next.js 15** - Full-stack React framework
- **TypeScript** - Type-safe development
- **Prisma** - Database ORM with dual-schema support
- **PostgreSQL** - Primary database system
- **NextAuth.js** - Authentication system

### **Frontend Technologies**
- **React 19** - UI library
- **Tailwind CSS v4** - Utility-first CSS framework
- **CSS Modules** - Component-level styling
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form management
- **React Hot Toast** - Notification system

### **Google Fonts Integration**
- **Next.js font optimization** with display swap
- **8 professional fonts** (Inter, Roboto, Open Sans, Lato, Poppins, Playfair Display, Merriweather, Crimson Text)
- **CSS variable system** for dynamic font switching

### **State Management**
- **React Context** - Client-side state (SSR compatible)
- **localStorage** - Persistent user preferences
- **No Redux** - Maintains server-side rendering compatibility

### **Development Tools**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Prisma Studio** - Database management GUI

## Development Phases

### **Phase 1: Foundation Architecture ✅**
**Completed**: Dual database schema design and Prisma setup
- Central database for platform management
- Tenant database schema for business operations
- Resolved schema conflicts and naming issues
- Environment configuration setup

### **Phase 2: Core Infrastructure ✅**
**Completed**: Database connection management and security
- Dynamic database connection system
- Encrypted credential storage (AES-256-GCM)
- Connection pooling and health monitoring
- State-based access control framework

### **Phase 3: Business Logic & APIs ✅**
**Completed**: Core business functionality
- GST calculation engine with intrastate/interstate support
- Tenant management APIs with full CRUD operations
- Authentication system with NextAuth integration
- Business entity management (customers, transactions)
- GST compliance and return generation APIs

### **Phase 4A: UI Foundation - Theme & Font System ✅**
**Completed**: Advanced customization framework
- **Theme System**: 7 preset themes with CSS variable-based architecture
- **Font System**: 8 Google Fonts with real-time switching
- **State Management**: React Context with localStorage persistence
- **CSS Architecture**: CSS Modules approach for reliability
- **UI Components**: Button, Card, Input with full theme support
- **Demo Implementation**: Interactive theme and font testing

### **Phase 4B: Dashboard & UI Components 🚧**
**Planned**: Advanced UI component library
- Dashboard widget system with drag-and-drop
- Data visualization components (charts, graphs)
- Advanced form components with validation
- Table components with sorting, filtering, pagination
- Modal and drawer components

### **Phase 5: Advanced Features 🚧**
**Planned**: Enterprise-grade functionality
- Custom fields engine for flexible data modeling
- Workflow builder for business process automation
- Advanced reporting and analytics dashboard
- Multi-language support (i18n)
- Export/import functionality (Excel, PDF)

### **Phase 6: Production Readiness 🚧**
**Planned**: Deployment and scaling
- Docker containerization
- CI/CD pipeline setup
- Performance optimization
- Security hardening
- Monitoring and logging setup

## Current Status

### **✅ Implemented Features**
- **Multi-tenant architecture** with tenant-per-database
- **Dual database system** (central + tenant)
- **GST calculation engine** with full compliance
- **State-based access control** and user management
- **Comprehensive API layer** for all business operations
- **Advanced theme system** with 7 preset themes
- **Professional font system** with 8 Google Fonts
- **React Context state management** (SSR compatible)
- **CSS Modules architecture** for reliable styling
- **Interactive demo pages** for theme and font testing

### **🔧 Technical Achievements**
- **Zero Tailwind conflicts** resolved with CSS-first approach
- **Server-side rendering** maintained throughout
- **Type-safe development** with comprehensive TypeScript coverage
- **Performance optimized** Google Fonts loading
- **Persistent user preferences** with localStorage integration
- **Real-time UI updates** without page refresh
- **Production-ready API foundation** with proper error handling

### **📊 Codebase Statistics**
- **25+ files** created/modified in theme system implementation
- **Dual Prisma schemas** with 20+ models each
- **10+ API endpoints** with full CRUD operations
- **3 React Context providers** for state management
- **CSS Modules** approach for component styling
- **Comprehensive TypeScript types** for all entities

## Future Roadmap

### **Immediate Next Steps (Phase 4B)**
1. **Dashboard Widget System**
   - Drag-and-drop dashboard builder
   - Customizable widget library
   - Real-time data binding

2. **Advanced UI Components**
   - Data tables with filtering/sorting
   - Chart components (bar, line, pie)
   - Advanced form controls

3. **Custom Fields Engine**
   - Dynamic field creation
   - Validation rule builder
   - Field dependency management

### **Medium-term Goals (Phase 5)**
1. **Workflow Builder**
   - Visual workflow designer
   - Approval processes
   - Automated notifications

2. **Advanced Analytics**
   - GST analytics dashboard
   - Business intelligence reports
   - Predictive analytics

3. **Multi-language Support**
   - i18n implementation
   - RTL language support
   - Regional customization

### **Long-term Vision (Phase 6+)**
1. **Mobile Application**
   - React Native implementation
   - Offline capability
   - Push notifications

2. **Advanced Integrations**
   - Banking API integration
   - E-commerce platform connectors
   - Government portal integration

3. **AI/ML Features**
   - Intelligent GST categorization
   - Expense prediction
   - Compliance risk assessment

## Contributing

### **Development Guidelines**
1. Follow the established **dual database architecture**
2. Use **TypeScript** for all new code
3. Implement **proper error handling** and logging
4. Write **comprehensive tests** for new features
5. Follow the **CSS Modules approach** for styling
6. Maintain **SSR compatibility** in all implementations

### **Code Standards**
- **ESLint configuration** must pass without errors
- **TypeScript strict mode** enabled
- **Comprehensive JSDoc** comments for public APIs
- **Consistent naming conventions** throughout
- **Git commit message** conventions

### **Testing Strategy**
- **Unit tests** for business logic
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows
- **Performance tests** for database operations

---

## License

This project is proprietary software developed for Indian ERP businesses with GST compliance requirements.

---

## Contact & Support

For technical questions or implementation support, refer to the development documentation or create an issue in the project repository.

**Note**: This README serves as the comprehensive technical documentation for the entire project evolution and architectural decisions made throughout the development process.
