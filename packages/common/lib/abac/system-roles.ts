// ============================================================================
// SYSTEM ROLES CONFIGURATION
// ============================================================================

import { SystemRoles, PermissionScope } from '@/types/abac';

export const SYSTEM_ROLES: SystemRoles = {
  super_admin: {
    description: "System-wide administrator with global access",
    scope: PermissionScope.GLOBAL,
    permissions: ["*:*"],
    isAssignable: false,
    systemRole: true
  },
  
  organization_admin: {
    description: "Organization administrator with full organizational control",
    scope: PermissionScope.ORGANIZATION,
    permissions: [
      "users:*",
      "roles:*", 
      "settings:*",
      "billing:*",
      "reports:read",
      "departments:*",
      "audit:read"
    ],
    isAssignable: true,
    systemRole: true
  },

  finance_manager: {
    description: "Financial operations manager",
    scope: PermissionScope.ORGANIZATION,
    permissions: [
      "invoices:*",
      "payments:*",
      "accounting:*",
      "customers:read,update",
      "vendors:read,update",
      "reports:read",
      "banking:*",
      "budgets:*"
    ],
    isAssignable: true,
    systemRole: true
  },

  sales_manager: {
    description: "Sales operations manager",
    scope: PermissionScope.DEPARTMENT,
    permissions: [
      "customers:*",
      "leads:*",
      "opportunities:*",
      "quotes:*",
      "orders:*",
      "products:read",
      "reports:read",
      "campaigns:*"
    ],
    isAssignable: true,
    systemRole: true
  },

  inventory_manager: {
    description: "Inventory and warehouse manager",
    scope: PermissionScope.DEPARTMENT,
    permissions: [
      "products:*",
      "inventory:*",
      "warehouses:*",
      "suppliers:read,update",
      "purchase_orders:read,update",
      "reports:read",
      "stock_adjustments:*"
    ],
    isAssignable: true,
    systemRole: true
  },

  hr_manager: {
    description: "Human resources manager",
    scope: PermissionScope.ORGANIZATION,
    permissions: [
      "employees:*",
      "payroll:*",
      "leave_management:*",
      "performance:*",
      "recruitment:*",
      "reports:read",
      "compliance:*"
    ],
    isAssignable: true,
    systemRole: true
  },

  project_manager: {
    description: "Project management lead",
    scope: PermissionScope.TEAM,
    permissions: [
      "projects:*",
      "tasks:*",
      "timesheets:read,update",
      "resources:read",
      "team_members:read",
      "reports:read",
      "milestones:*"
    ],
    isAssignable: true,
    systemRole: true
  },

  sales_representative: {
    description: "Sales team member",
    scope: PermissionScope.PERSONAL,
    permissions: [
      "customers:read,update",
      "leads:read,update,create",
      "opportunities:read,update,create",
      "quotes:read,update,create",
      "orders:read,create",
      "products:read",
      "activities:create,read,update"
    ],
    isAssignable: true,
    systemRole: true
  },

  accountant: {
    description: "Accounting staff member",
    scope: PermissionScope.DEPARTMENT,
    permissions: [
      "invoices:read,update,create",
      "payments:read,create",
      "accounting:read,update",
      "customers:read",
      "vendors:read",
      "reports:read",
      "reconciliation:*"
    ],
    isAssignable: true,
    systemRole: true
  },

  employee: {
    description: "Regular employee with personal data access",
    scope: PermissionScope.PERSONAL,
    permissions: [
      "profile:read,update",
      "timesheets:read,update,create",
      "leave_requests:read,update,create",
      "expenses:read,update,create",
      "tasks:read,update",
      "documents:read"
    ],
    isAssignable: true,
    systemRole: true
  },

  customer: {
    description: "External customer with limited access",
    scope: PermissionScope.PERSONAL,
    permissions: [
      "profile:read,update",
      "orders:read",
      "invoices:read",
      "payments:read",
      "support_tickets:read,create,update",
      "portal:read"
    ],
    isAssignable: true,
    systemRole: true
  },

  vendor: {
    description: "External vendor with supplier portal access",
    scope: PermissionScope.PERSONAL,
    permissions: [
      "profile:read,update",
      "purchase_orders:read",
      "invoices:create,read",
      "payments:read",
      "support_tickets:read,create,update",
      "catalog:read,update"
    ],
    isAssignable: true,
    systemRole: true
  }
};

// Role hierarchy mapping
export const ROLE_HIERARCHY = {
  super_admin: [],
  organization_admin: ['super_admin'],
  finance_manager: ['organization_admin'],
  sales_manager: ['organization_admin'],
  inventory_manager: ['organization_admin'],
  hr_manager: ['organization_admin'],
  project_manager: ['organization_admin'],
  sales_representative: ['sales_manager'],
  accountant: ['finance_manager'],
  employee: ['hr_manager'],
  customer: [],
  vendor: []
};

// Scope level definitions
export const SCOPE_DEFINITIONS = {
  [PermissionScope.GLOBAL]: {
    level: 1,
    description: "System-wide access across all organizations",
    appliesTo: ["super_admin"]
  },
  [PermissionScope.ORGANIZATION]: {
    level: 2,
    description: "Access within specific organization",
    appliesTo: ["organization_admin", "finance_manager", "hr_manager"]
  },
  [PermissionScope.DEPARTMENT]: {
    level: 3,
    description: "Access within specific department/division",
    appliesTo: ["sales_manager", "inventory_manager", "accountant"]
  },
  [PermissionScope.TEAM]: {
    level: 4,
    description: "Access within specific team",
    appliesTo: ["project_manager"]
  },
  [PermissionScope.PERSONAL]: {
    level: 5,
    description: "Access to own records only",
    appliesTo: ["employee", "sales_representative", "customer", "vendor"]
  }
};

// Resource-action matrix defining what actions are allowed for each resource at different scopes
export const RESOURCE_ACTION_MATRIX = {
  users: {
    actions: ['create', 'read', 'update', 'delete', 'assign_role', 'reset_password'],
    scopeRules: {
      create: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT],
      read: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT, PermissionScope.TEAM, PermissionScope.PERSONAL],
      update: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT, PermissionScope.PERSONAL],
      delete: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT],
      assign_role: [PermissionScope.ORGANIZATION],
      reset_password: [PermissionScope.ORGANIZATION, PermissionScope.PERSONAL]
    }
  },
  customers: {
    actions: ['create', 'read', 'update', 'delete', 'view_financials'],
    scopeRules: {
      create: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT, PermissionScope.TEAM],
      read: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT, PermissionScope.TEAM, PermissionScope.PERSONAL],
      update: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT, PermissionScope.TEAM, PermissionScope.PERSONAL],
      delete: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT],
      view_financials: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT]
    }
  },
  invoices: {
    actions: ['create', 'read', 'update', 'delete', 'approve', 'void'],
    scopeRules: {
      create: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT, PermissionScope.TEAM],
      read: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT, PermissionScope.TEAM, PermissionScope.PERSONAL],
      update: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT, PermissionScope.TEAM, PermissionScope.PERSONAL],
      delete: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT],
      approve: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT],
      void: [PermissionScope.ORGANIZATION]
    }
  },
  products: {
    actions: ['create', 'read', 'update', 'delete', 'manage_pricing'],
    scopeRules: {
      create: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT],
      read: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT, PermissionScope.TEAM, PermissionScope.PERSONAL],
      update: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT, PermissionScope.TEAM],
      delete: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT],
      manage_pricing: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT]
    }
  },
  projects: {
    actions: ['create', 'read', 'update', 'delete', 'assign_members', 'view_budget'],
    scopeRules: {
      create: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT, PermissionScope.TEAM],
      read: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT, PermissionScope.TEAM, PermissionScope.PERSONAL],
      update: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT, PermissionScope.TEAM],
      delete: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT],
      assign_members: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT, PermissionScope.TEAM],
      view_budget: [PermissionScope.ORGANIZATION, PermissionScope.DEPARTMENT]
    }
  }
}; 