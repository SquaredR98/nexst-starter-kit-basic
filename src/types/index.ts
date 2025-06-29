// ============================================================================
// CORE TYPES & ENUMS
// ============================================================================

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL'
}

export enum AttributeRuleEffect {
  ALLOW = 'ALLOW',
  DENY = 'DENY'
}

export enum DeploymentType {
  CLOUD = 'cloud',
  ON_PREMISE = 'onpremise',
  HYBRID = 'hybrid'
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  ORGANIZATION_OWNER = 'ORGANIZATION_OWNER',
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  MANAGER = 'MANAGER',
  SENIOR_USER = 'SENIOR_USER',
  STANDARD_USER = 'STANDARD_USER',
  READ_ONLY_USER = 'READ_ONLY_USER',
  GUEST_USER = 'GUEST_USER',
  SPECIALIST = 'SPECIALIST',
  EXTERNAL_AUDITOR = 'EXTERNAL_AUDITOR',
  CUSTOMER_PORTAL_USER = 'CUSTOMER_PORTAL_USER',
  VENDOR_PORTAL_USER = 'VENDOR_PORTAL_USER'
}

export enum ModuleType {
  FINANCIAL = 'financial',
  INVENTORY = 'inventory',
  CRM = 'crm',
  HR = 'hr',
  MANUFACTURING = 'manufacturing',
  PROJECTS = 'projects',
  ADMIN = 'admin',
  DASHBOARD = 'dashboard'
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  EXPORT = 'export',
  IMPORT = 'import',
  ASSIGN = 'assign',
  PROCESS = 'process'
}

export enum PermissionScope {
  OWN = 'own',
  DEPARTMENT = 'department',
  ORGANIZATION = 'organization',
  ALL = 'all'
}

// ============================================================================
// ORGANIZATION & TENANT TYPES
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  country: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  parent?: Department;
  children?: Department[];
  manager?: User;
  employees?: User[];
}

// ============================================================================
// USER MANAGEMENT TYPES
// ============================================================================

export interface User {
  id: string;
  organizationId: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  emailVerified?: Date;
  phoneVerified?: Date;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  department?: Department;
  organization: Organization;
  roles?: UserRoleAssignment[];
}

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  organizationId: string;
  departmentId?: string;
  assignedById: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  role: Role;
}

// ============================================================================
// RBAC TYPES
// ============================================================================

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  level: number; // 1=System, 2=Platform, 3=Org, 4=Department
  isSystemRole: boolean;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  organizationId?: string;
  module: string;
  resource: string;
  action: string;
  scope: string;
  description?: string;
  createdAt: Date;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  grantedById: string;
  grantedAt: Date;
}

// ============================================================================
// ABAC TYPES
// ============================================================================

export interface AttributeRule {
  id: string;
  organizationId: string;
  ruleName: string;
  conditionExpression: Record<string, unknown>; // JSON logic expression
  permissionEffect: AttributeRuleEffect;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessContext {
  user: User;
  organization: Organization;
  department?: Department;
  currentTime: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description?: string;
  priceMonthly?: number;
  priceAnnual?: number;
  maxUsers?: number;
  maxStorageGb?: number;
  features: FeatureFlags;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  autoRenew: boolean;
  paymentMethodId?: string;
  createdAt: Date;
  updatedAt: Date;
  plan: SubscriptionPlan;
}

export interface SubscriptionUsage {
  id: string;
  subscriptionId: string;
  metricName: string;
  usageValue: number;
  periodStart: Date;
  periodEnd: Date;
  recordedAt: Date;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

// ============================================================================
// AUDIT & COMPLIANCE TYPES
// ============================================================================

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  actionType: string;
  module: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  riskScore: number;
  timestamp: Date;
  user: User;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: string | number | boolean | Date | null | undefined;
}

// ============================================================================
// FORM & VALIDATION TYPES
// ============================================================================

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  departmentId?: string;
  roleIds: string[];
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  departmentId?: string;
  isActive?: boolean;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  country?: string;
  currency?: string;
  timezone?: string;
}

export interface CreateRoleRequest {
  name: string;
  code: string;
  description?: string;
  level: number;
  permissionIds: string[];
}

// ============================================================================
// DASHBOARD & ANALYTICS TYPES
// ============================================================================

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'alert';
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data: KPIMetric | ChartData | unknown;
  refreshInterval?: number;
}

export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  unit?: string;
  format?: 'currency' | 'percentage' | 'number';
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

// ============================================================================
// BUSINESS MODULE TYPES
// ============================================================================

// Financial Module Types
export interface FinancialAccount {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: string;
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntry {
  id: string;
  organizationId: string;
  entryNumber: string;
  date: Date;
  description: string;
  reference?: string;
  totalAmount: number;
  status: 'draft' | 'posted' | 'approved';
  createdById: string;
  approvedById?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Inventory Module Types
export interface Product {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// CRM Module Types
export interface Customer {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  creditLimit?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// HR Module Types
export interface Employee {
  id: string;
  organizationId: string;
  employeeId: string;
  userId: string;
  departmentId: string;
  position: string;
  salary: number;
  joiningDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  department: Department;
}

// ============================================================================
// NAVIGATION & UI TYPES
// ============================================================================

export interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  children?: NavigationItem[];
  permission?: string;
  badge?: string;
  isActive?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive?: boolean;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// ============================================================================
// SYSTEM CONFIGURATION TYPES
// ============================================================================

export interface SystemConfig {
  id: string;
  organizationId?: string;
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  description?: string;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppConfig {
  appName: string;
  appUrl: string;
  deploymentType: DeploymentType;
  features: FeatureFlags;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
  };
  security: {
    sessionTimeout: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
  };
} 