# Central App Admin Setup Guide

This document summarizes the key steps, decisions, and current status for setting up the admin layout and authentication/session management in the central app of your ERP monorepo. Use this as a reference to continue work in any workspace.

---

## 1. Monorepo Structure

- **Structure:**
  - `/apps/central` — Central platform app (admin, super admin, SaaS ops)
  - `/apps/tenant` — Tenant-facing ERP app
  - `/packages/common` — Shared UI, types, and utilities

- **TypeScript & NPM Workspaces:**
  - Path aliases (e.g., `@common/*`) are set up in root and app-level `tsconfig.json`.
  - Each app has a unique name in its `package.json`.

---

## 2. Admin Layout Refactor

- The central app's root layout (`apps/central/src/app/layout.tsx`) now uses the shared `MainLayout` from `@common/components/layout/MainLayout`.
- Providers (`AuthProvider`, `ThemeProvider`, `FontProvider`) are imported from `../providers/` and wrap the app.
- The shared `MainLayout` provides:
  - Sidebar navigation
  - Header with user/session controls
  - Breadcrumbs
  - Session protection (shows loading/access denied if not logged in)

---

## 3. TypeScript Configuration

- `apps/central/tsconfig.json` includes:
  ```json
  {
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "jsx": "react-jsx",
      "esModuleInterop": true
    }
  }
  ```
- This enables JSX and React default imports in the central app.

---

## 4. Authentication & Session Management

- **NextAuth is set up** at `apps/central/src/app/api/auth/[...nextauth]/route.ts`.
  - Uses a custom credentials provider (email, password, tenant slug).
  - Authenticates against central and tenant databases.
  - Stores user, tenant, and permissions context in the session.
- **AuthProvider** wraps the app and provides session context.
- **Session protection** is handled by `MainLayout`.

---

## 5. Next Steps

- **Scaffold a login page** at `apps/central/src/app/login/page.tsx`:
  - Form for email, password, and tenant slug.
  - Uses `signIn('credentials', ...)` from NextAuth.
- **Test session flow:**
  - Unauthenticated users see access denied or are redirected to login.
  - Authenticated users see the admin dashboard.

---

## 6. Troubleshooting

- If you see `Cannot find module '../providers/AuthProvider'`, ensure the import path is correct (relative to `layout.tsx`).
- If you see JSX or React import errors, check that `jsx` and `esModuleInterop` are set in the app's `tsconfig.json`.

---

**You can continue this setup in any workspace by following the above structure and steps.** 