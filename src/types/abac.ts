// ============================================================================
// ABAC TYPES - Attribute-Based Access Control System
// ============================================================================

import { User, Organization, Role, Permission } from '@prisma/client';

// ============================================================================
// CORE ABAC TYPES
// ============================================================================

export interface AccessRequest {
  userId: string;
  organizationId: string;
  resource: string;
  action: string;
  resourceId?: string;
  context?: Record<string, any>;
}

export interface AccessDecision {
  decision: AccessDecisionType;
  reason: string;
  policiesEvaluated: string[];
  evaluationTimeMs: number;
  conditions?: Record<string, any>;
}

export type AccessDecisionType = 'PERMIT' | 'DENY' | 'INDETERMINATE';

export interface UserContext {
  userId: string;
  organizationId: string;
  email: string;
  roles: string[];
  attributes: Record<string, any>;
  department?: string;
  teams?: string[];
  lastLogin?: Date;
}

export interface ResourceContext {
  resourceType: string;
  resourceId: string;
  attributes: Record<string, any>;
  organizationId: string;
  department?: string;
  team?: string;
  owner?: string;
}

// ============================================================================
// PERMISSION SCOPES
// ============================================================================

export enum PermissionScope {
  GLOBAL = 'GLOBAL',
  ORGANIZATION = 'ORGANIZATION', 
  DEPARTMENT = 'DEPARTMENT',
  TEAM = 'TEAM',
  PERSONAL = 'PERSONAL'
}

export interface ScopeDefinition {
  level: number;
  description: string;
  appliesTo: string[];
}

export interface ScopeHierarchy {
  [PermissionScope.GLOBAL]: ScopeDefinition;
  [PermissionScope.ORGANIZATION]: ScopeDefinition;
  [PermissionScope.DEPARTMENT]: ScopeDefinition;
  [PermissionScope.TEAM]: ScopeDefinition;
  [PermissionScope.PERSONAL]: ScopeDefinition;
}

// ============================================================================
// POLICY TYPES
// ============================================================================

export interface AbacPolicyRule {
  subject: PolicySubject;
  resource: PolicyResource;
  action: PolicyAction;
  conditions: PolicyCondition[];
  effect: 'PERMIT' | 'DENY';
}

export interface PolicySubject {
  type: 'user' | 'role' | 'group';
  attributes?: Record<string, any>;
  conditions?: PolicyCondition[];
}

export interface PolicyResource {
  type: string;
  attributes?: Record<string, any>;
  conditions?: PolicyCondition[];
}

export interface PolicyAction {
  name: string;
  conditions?: PolicyCondition[];
}

export interface PolicyCondition {
  type: 'attribute' | 'time' | 'location' | 'custom';
  field: string;
  operator: PolicyOperator;
  value: any;
  logic?: 'AND' | 'OR' | 'NOT';
}

export type PolicyOperator = 
  | 'equals' | 'not_equals' 
  | 'greater_than' | 'less_than' 
  | 'greater_than_or_equal' | 'less_than_or_equal'
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'in' | 'not_in'
  | 'exists' | 'not_exists';

// ============================================================================
// SYSTEM ROLES DEFINITION
// ============================================================================

export interface SystemRoleDefinition {
  description: string;
  scope: PermissionScope;
  permissions: string[];
  inheritsFrom?: string;
  isAssignable: boolean;
  systemRole: boolean;
  conditions?: Record<string, any>;
}

export interface SystemRoles {
  super_admin: SystemRoleDefinition;
  organization_admin: SystemRoleDefinition;
  finance_manager: SystemRoleDefinition;
  sales_manager: SystemRoleDefinition;
  inventory_manager: SystemRoleDefinition;
  hr_manager: SystemRoleDefinition;
  project_manager: SystemRoleDefinition;
  sales_representative: SystemRoleDefinition;
  accountant: SystemRoleDefinition;
  employee: SystemRoleDefinition;
  customer: SystemRoleDefinition;
  vendor: SystemRoleDefinition;
}

// ============================================================================
// RESOURCE-ACTION MATRIX
// ============================================================================

export interface ResourceActionMatrix {
  [resource: string]: {
    actions: string[];
    scopeRules: {
      [action: string]: PermissionScope[];
    };
  };
}

// ============================================================================
// PERMISSION CONDITIONS
// ============================================================================

export interface PermissionCondition {
  scope?: ScopeCondition;
  timeBased?: TimeBasedCondition;
  attributeBased?: AttributeBasedCondition;
  resourceBased?: ResourceBasedCondition;
}

export interface ScopeCondition {
  level: PermissionScope;
  requiredAttributes?: string[];
}

export interface TimeBasedCondition {
  allowedHours?: number[];
  allowedDays?: number[];
  timezone?: string;
  validFrom?: Date;
  validUntil?: Date;
}

export interface AttributeBasedCondition {
  requiredAttributes: Record<string, any>;
  operator?: 'AND' | 'OR';
}

export interface ResourceBasedCondition {
  ownershipRequired?: boolean;
  departmentMatch?: boolean;
  teamMatch?: boolean;
  customRules?: Record<string, any>;
}

// ============================================================================
// AUDIT AND MONITORING
// ============================================================================

export interface AccessAttempt {
  id: string;
  userId?: string;
  organizationId: string;
  resource: string;
  action: string;
  resourceId?: string;
  decision: AccessDecisionType;
  reason?: string;
  evaluationTimeMs?: number;
  policiesEvaluated: string[];
  context?: Record<string, any>;
  timestamp: Date;
}

export interface PerformanceMetrics {
  avgEvaluationTime: number;
  maxEvaluationTime: number;
  minEvaluationTime: number;
  cacheHitRate: number;
  slowQueriesCount: number;
  totalEvaluations: number;
}

export interface AccessReport {
  period: {
    start: string;
    end: string;
  };
  statistics: {
    totalAttempts: number;
    permitted: number;
    denied: number;
    uniqueUsers: number;
    resourcesAccessed: number;
    avgEvaluationTime: number;
  };
  topDeniedResources: Array<{
    resource: string;
    action: string;
    denialCount: number;
  }>;
  mostActiveUsers: Array<{
    email: string;
    accessCount: number;
    deniedCount: number;
  }>;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface CreateRoleRequest {
  name: string;
  description?: string;
  parentRoleId?: string;
  permissions?: Array<{
    permissionId: string;
    conditions?: PermissionCondition;
  }>;
}

export interface AssignRoleRequest {
  userId: string;
  roleIds: string[];
  validFrom?: Date;
  validUntil?: Date;
}

export interface CheckPermissionRequest {
  userId?: string;
  resource: string;
  action: string;
  resourceId?: string;
  context?: Record<string, any>;
}

export interface CheckPermissionResponse {
  permitted: boolean;
  decision: AccessDecisionType;
  reason: string;
  evaluationTimeMs: number;
  conditions?: Record<string, any>;
}

export interface BulkPermissionCheckRequest {
  permissions: CheckPermissionRequest[];
}

export interface BulkPermissionCheckResponse {
  results: Array<CheckPermissionRequest & CheckPermissionResponse>;
}

export interface CreatePolicyRequest {
  name: string;
  description?: string;
  policyRule: AbacPolicyRule;
  priority?: number;
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CachedUserPermissions {
  userId: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
  attributes: Record<string, any>;
  cachedAt: Date;
  expiresAt: Date;
}

export interface CacheKey {
  type: 'user_permissions' | 'user_context' | 'resource_attributes' | 'policy_evaluation';
  organizationId: string;
  identifier: string;
}

// ============================================================================
// EXTENDED PRISMA TYPES
// ============================================================================

export interface UserWithContext extends User {
  roles: Role[];
  permissions: Permission[];
  attributes: Record<string, any>;
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface RoleWithPermissions extends Role {
  permissions: Array<{
    permission: Permission;
    conditions?: Record<string, any>;
  }>;
}

// ============================================================================
// EVALUATION CONTEXT
// ============================================================================

export interface EvaluationContext {
  request: AccessRequest;
  userContext: UserContext;
  resourceContext?: ResourceContext;
  environmentContext: {
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

// ============================================================================
// RULE ENGINE CONFIGURATION
// ============================================================================

export interface RuleEngineConfig {
  cacheTtl: number; // Cache time-to-live in seconds
  slowQueryThreshold: number; // Threshold for slow query alerts in ms
  maxPolicyEvaluations: number; // Maximum policies to evaluate per request
  enableAuditLogging: boolean;
  enablePerformanceMonitoring: boolean;
  defaultDecision: AccessDecisionType; // Default decision when evaluation fails
}

export interface RuleEngineMetrics {
  totalEvaluations: number;
  successfulEvaluations: number;
  failedEvaluations: number;
  averageEvaluationTime: number;
  cacheHitRate: number;
  slowQueriesCount: number;
} 