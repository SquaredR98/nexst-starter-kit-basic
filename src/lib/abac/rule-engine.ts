// ============================================================================
// ABAC RULE ENGINE - Core Permission Evaluation System
// ============================================================================

import { prisma } from '@/lib/prisma';
import { 
  AccessRequest, 
  AccessDecision, 
  AccessDecisionType, 
  UserContext, 
  ResourceContext,
  PermissionScope,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  PermissionCondition,
  EvaluationContext,
  RuleEngineConfig
} from '@/types/abac';

export class ABACRuleEngine {
  private config: RuleEngineConfig;

  constructor(config?: Partial<RuleEngineConfig>) {
    this.config = {
      cacheTtl: 300, // 5 minutes
      slowQueryThreshold: 100, // 100ms
      maxPolicyEvaluations: 50,
      enableAuditLogging: true,
      enablePerformanceMonitoring: true,
      defaultDecision: 'DENY',
      ...config
    };
  }

  /**
   * Main entry point for access evaluation
   */
  async evaluateAccess(request: AccessRequest): Promise<AccessDecision> {
    const startTime = Date.now();
    
    try {
      // Step 1: Get user context and validate user
      const userContext = await this.getUserContext(request.userId, request.organizationId);
      if (!userContext) {
        return this.createDecision('DENY', 'User not found or inactive', [], startTime);
      }

      // Step 2: Get resource context if resourceId is provided
      const resourceContext = request.resourceId 
        ? await this.getResourceContext(request.organizationId, request.resource, request.resourceId)
        : undefined;

      // Step 3: Create evaluation context
      const evaluationContext: EvaluationContext = {
        request,
        userContext,
        resourceContext,
        environmentContext: {
          timestamp: new Date(),
          ipAddress: request.context?.ipAddress,
          userAgent: request.context?.userAgent,
          sessionId: request.context?.sessionId
        }
      };

      // Step 4: Evaluate RBAC permissions (role-based)
      const rbacDecision = await this.evaluateRBAC(evaluationContext);
      
      // Step 5: Evaluate ABAC policies (attribute-based)
      const abacDecision = await this.evaluateABACPolicies(evaluationContext);
      
      // Step 6: Combine decisions using policy combination algorithm
      const finalDecision = this.combineDecisions([rbacDecision, abacDecision], startTime);
      
      // Step 7: Log access attempt if enabled
      if (this.config.enableAuditLogging) {
        await this.logAccessAttempt(request, finalDecision, userContext);
      }
      
      return finalDecision;
      
    } catch (error) {
      console.error('Error evaluating access:', error);
      return this.createDecision(
        'INDETERMINATE', 
        `Evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        [], 
        startTime
      );
    }
  }

  /**
   * Get comprehensive user context including roles and attributes
   */
  private async getUserContext(userId: string, organizationId: string): Promise<UserContext | null> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          organizationId,
          isActive: true
        },
        include: {
          userRoles: {
            where: { isActive: true },
            include: {
              role: true
            }
          },
          userAttributes: true,
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      if (!user) return null;

      // Parse user attributes
      const attributes: Record<string, unknown> = {};
      user.userAttributes.forEach(attr => {
        try {
          // Try to parse as JSON for complex values
          attributes[attr.attributeName] = attr.attributeType === 'json' 
            ? JSON.parse(attr.attributeValue)
            : attr.attributeValue;
        } catch {
          // Fallback to string value
          attributes[attr.attributeName] = attr.attributeValue;
        }
      });

      return {
        userId: user.id,
        organizationId: user.organizationId,
        email: user.email,
        roles: user.userRoles.map(ur => ur.role.code),
        attributes,
        department: user.department?.code,
        teams: Array.isArray(attributes.teams) ? attributes.teams : [],
        lastLogin: user.lastLoginAt || undefined
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  }

  /**
   * Get resource context including attributes
   */
  private async getResourceContext(
    organizationId: string, 
    resourceType: string, 
    resourceId: string
  ): Promise<ResourceContext | undefined> {
    try {
      const resourceAttributes = await prisma.resourceAttribute.findMany({
        where: {
          organizationId,
          resourceType,
          resourceId
        }
      });

      const attributes: Record<string, any> = {};
      resourceAttributes.forEach(attr => {
        try {
          attributes[attr.attributeName] = attr.attributeType === 'json'
            ? JSON.parse(attr.attributeValue)
            : attr.attributeValue;
        } catch {
          attributes[attr.attributeName] = attr.attributeValue;
        }
      });

      return {
        resourceType,
        resourceId,
        attributes,
        organizationId,
        department: attributes.department as string,
        team: attributes.team as string,
        owner: attributes.owner as string
      };
    } catch (error) {
      console.error('Error getting resource context:', error);
      return undefined;
    }
  }

  /**
   * Evaluate Role-Based Access Control permissions
   */
  private async evaluateRBAC(context: EvaluationContext): Promise<AccessDecision> {
    const startTime = Date.now();
    const { request, userContext } = context;

    if (!userContext.roles || userContext.roles.length === 0) {
      return this.createDecision('DENY', 'User has no roles assigned', ['RBAC'], startTime);
    }

    try {
      // Get permissions for user's roles
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          role: {
            code: { in: userContext.roles },
            organizationId: request.organizationId,
            isActive: true
          }
        },
        include: {
          permission: true,
          role: true
        }
      });

      // Find matching permissions for the requested resource and action
      const matchingPermissions = rolePermissions.filter(rp => 
        rp.permission.resource === request.resource && 
        rp.permission.action === request.action
      );

      if (matchingPermissions.length === 0) {
        return this.createDecision(
          'DENY', 
          `No permission found for ${request.resource}:${request.action}`, 
          ['RBAC'], 
          startTime
        );
      }

      // Evaluate scope-based conditions for each matching permission
      for (const permission of matchingPermissions) {
        const scopeCheck = await this.checkScopePermission(
          permission.permission.scope as PermissionScope,
          context
        );

        if (scopeCheck) {
          return this.createDecision(
            'PERMIT', 
            `RBAC permission granted via role: ${permission.role.name}`, 
            ['RBAC'], 
            startTime
          );
        }
      }

      return this.createDecision('DENY', 'RBAC scope conditions not met', ['RBAC'], startTime);
      
    } catch (error) {
      console.error('Error evaluating RBAC:', error);
      return this.createDecision('INDETERMINATE', 'RBAC evaluation failed', ['RBAC'], startTime);
    }
  }

  /**
   * Evaluate ABAC policies
   */
  private async evaluateABACPolicies(context: EvaluationContext): Promise<AccessDecision> {
    const startTime = Date.now();
    const { request } = context;

    try {
      const policies = await prisma.abacPolicy.findMany({
        where: {
          organizationId: request.organizationId,
          isActive: true
        },
        orderBy: { priority: 'desc' }
      });

      const evaluatedPolicies: string[] = [];
      
      for (const policy of policies.slice(0, this.config.maxPolicyEvaluations)) {
        evaluatedPolicies.push(policy.name);
        
        const policyResult = await this.evaluatePolicy(policy, context);
        
        if (policyResult.decision === 'PERMIT') {
          return this.createDecision(
            'PERMIT', 
            `ABAC policy granted: ${policy.name}`, 
            evaluatedPolicies, 
            startTime
          );
        } else if (policyResult.decision === 'DENY') {
          return this.createDecision(
            'DENY', 
            `ABAC policy denied: ${policy.name}`, 
            evaluatedPolicies, 
            startTime
          );
        }
      }

      return this.createDecision('DENY', 'No ABAC policies granted access', evaluatedPolicies, startTime);
      
    } catch (error) {
      console.error('Error evaluating ABAC policies:', error);
      return this.createDecision('INDETERMINATE', 'ABAC evaluation failed', [], startTime);
    }
  }

  /**
   * Evaluate a specific ABAC policy
   */
  private async evaluatePolicy(policy: any, context: EvaluationContext): Promise<AccessDecision> {
    try {
      const policyRule = policy.policyRule;
      
      // Basic policy structure validation
      if (!policyRule.subject || !policyRule.resource || !policyRule.action) {
        return this.createDecision('INDETERMINATE', 'Invalid policy structure', [], Date.now());
      }

      // Evaluate subject conditions
      const subjectMatch = this.evaluateSubjectConditions(policyRule.subject, context.userContext);
      if (!subjectMatch) {
        return this.createDecision('DENY', 'Subject conditions not met', [], Date.now());
      }

      // Evaluate resource conditions
      const resourceMatch = this.evaluateResourceConditions(policyRule.resource, context);
      if (!resourceMatch) {
        return this.createDecision('DENY', 'Resource conditions not met', [], Date.now());
      }

      // Evaluate action conditions
      const actionMatch = this.evaluateActionConditions(policyRule.action, context.request);
      if (!actionMatch) {
        return this.createDecision('DENY', 'Action conditions not met', [], Date.now());
      }

      // All conditions met, return policy effect
      return this.createDecision(
        policyRule.effect === 'PERMIT' ? 'PERMIT' : 'DENY',
        `Policy ${policy.name} effect: ${policyRule.effect}`,
        [],
        Date.now()
      );
      
    } catch (error) {
      console.error('Error evaluating policy:', error);
      return this.createDecision('INDETERMINATE', 'Policy evaluation error', [], Date.now());
    }
  }

  /**
   * Check scope-based permissions
   */
  private async checkScopePermission(
    scope: PermissionScope, 
    context: EvaluationContext
  ): Promise<boolean> {
    const { request, userContext, resourceContext } = context;

    switch (scope) {
      case PermissionScope.GLOBAL:
        return userContext.roles.includes('super_admin');

      case PermissionScope.ORGANIZATION:
        return userContext.organizationId === request.organizationId;

      case PermissionScope.DEPARTMENT:
        if (!userContext.department) return false;
        if (!resourceContext?.department) return true; // Allow creation
        return userContext.department === resourceContext.department;

      case PermissionScope.TEAM:
        if (!userContext.teams || userContext.teams.length === 0) return false;
        if (!resourceContext?.team) return true; // Allow creation
        return userContext.teams.includes(resourceContext.team);

      case PermissionScope.PERSONAL:
        return this.checkPersonalScope(request, userContext, resourceContext);

      default:
        return false;
    }
  }

  /**
   * Check personal scope permissions
   */
  private checkPersonalScope(
    request: AccessRequest, 
    userContext: UserContext, 
    resourceContext?: ResourceContext
  ): boolean {
    // Direct user resource access
    if (request.resource === 'users' && request.resourceId === userContext.userId) {
      return true;
    }

    // Check resource ownership
    if (resourceContext?.owner === userContext.userId) {
      return true;
    }

    // Resource-specific personal scope rules
    const personalResources = ['timesheets', 'expenses', 'leave_requests', 'employee_records'];
    if (personalResources.includes(request.resource)) {
      return resourceContext?.attributes?.userId === userContext.userId;
    }

    return false;
  }

  /**
   * Evaluate subject conditions in policy
   */
  private evaluateSubjectConditions(subject: any, userContext: UserContext): boolean {
    if (subject.type === 'user' && subject.attributes) {
      return this.matchAttributes(subject.attributes, userContext.attributes);
    }
    
    if (subject.type === 'role') {
      const requiredRoles = Array.isArray(subject.roles) ? subject.roles : [subject.roles];
      return requiredRoles.some((role: string) => userContext.roles.includes(role));
    }

    return true; // Default allow if no specific conditions
  }

  /**
   * Evaluate resource conditions in policy
   */
  private evaluateResourceConditions(resource: any, context: EvaluationContext): boolean {
    if (!resource.attributes || !context.resourceContext) return true;
    
    return this.matchAttributes(resource.attributes, context.resourceContext.attributes);
  }

  /**
   * Evaluate action conditions in policy
   */
  private evaluateActionConditions(action: any, request: AccessRequest): boolean {
    if (action.name && action.name !== request.action) return false;
    
    // Additional action-specific conditions can be added here
    return true;
  }

  /**
   * Match attributes using simple equality check
   */
  private matchAttributes(required: Record<string, any>, actual: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(required)) {
      if (actual[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Combine multiple access decisions using deny-overrides algorithm
   */
  private combineDecisions(decisions: AccessDecision[], startTime: number): AccessDecision {
    let hasPermit = false;
    let hasDeny = false;
    let hasIndeterminate = false;
    
    const allPolicies: string[] = [];
    const reasons: string[] = [];

    for (const decision of decisions) {
      allPolicies.push(...decision.policiesEvaluated);
      reasons.push(decision.reason);

      if (decision.decision === 'DENY') {
        hasDeny = true;
      } else if (decision.decision === 'PERMIT') {
        hasPermit = true;
      } else {
        hasIndeterminate = true;
      }
    }

    // Permit-overrides algorithm: if any decision is PERMIT and no explicit DENY, allow
    if (hasPermit && !hasDeny) {
      return this.createDecision('PERMIT', reasons.find(r => r.includes('PERMIT')) || 'Access granted', allPolicies, startTime);
    }
    
    if (hasDeny) {
      return this.createDecision('DENY', reasons.find(r => r.includes('DENY')) || 'Access denied', allPolicies, startTime);
    }
    
    if (hasIndeterminate) {
      return this.createDecision('INDETERMINATE', 'Evaluation inconclusive', allPolicies, startTime);
    }

    return this.createDecision(this.config.defaultDecision, 'No applicable policies found', allPolicies, startTime);
  }

  /**
   * Create an access decision with timing
   */
  private createDecision(
    decision: AccessDecisionType, 
    reason: string, 
    policies: string[], 
    startTime: number
  ): AccessDecision {
    return {
      decision,
      reason,
      policiesEvaluated: policies,
      evaluationTimeMs: Date.now() - startTime
    };
  }

  /**
   * Log access attempt for audit purposes
   */
  private async logAccessAttempt(
    request: AccessRequest, 
    decision: AccessDecision, 
    userContext: UserContext
  ): Promise<void> {
    try {
      await prisma.accessLog.create({
        data: {
          organizationId: request.organizationId,
          userId: request.userId,
          resource: request.resource,
          action: request.action,
          resourceId: request.resourceId,
          decision: decision.decision,
          reason: decision.reason,
          evaluationTimeMs: decision.evaluationTimeMs,
          policiesEvaluated: decision.policiesEvaluated,
          context: {
            userRoles: userContext.roles,
            userAttributes: userContext.attributes,
            requestContext: request.context || {},
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Error logging access attempt:', error);
    }
  }

  /**
   * Check if user has permission for a specific resource and action
   */
  async hasPermission(
    userId: string, 
    organizationId: string, 
    resource: string, 
    action: string, 
    resourceId?: string
  ): Promise<boolean> {
    const request: AccessRequest = {
      userId,
      organizationId,
      resource,
      action,
      resourceId
    };

    const decision = await this.evaluateAccess(request);
    return decision.decision === 'PERMIT';
  }

  /**
   * Get user's effective permissions for a resource
   */
  async getUserPermissions(
    userId: string, 
    organizationId: string, 
    resource: string
  ): Promise<string[]> {
    const userContext = await this.getUserContext(userId, organizationId);
    if (!userContext) return [];

    // Get all permissions for user's roles on this resource
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role: {
          code: { in: userContext.roles },
          organizationId,
          isActive: true
        },
        permission: {
          resource
        }
      },
      include: {
        permission: true
      }
    });

    return rolePermissions.map(rp => rp.permission.action);
  }
}

// Export singleton instance
export const ruleEngine = new ABACRuleEngine(); 