import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth'
import { db } from '../database/connection-manager'

// Tenant context interface
export interface TenantContext {
  tenantId: string
  organizationId: string
  userId: string
  stateBranchId: string | null
  isStateRestricted: boolean
  allowedStates: string[]
  role: string
  permissions: string[]
}

// Extended request with tenant context
export interface TenantRequest extends NextRequest {
  tenant: TenantContext
}

/**
 * Middleware to identify tenant and set up database context
 */
export async function tenantMiddleware(req: NextRequest): Promise<NextResponse | TenantContext> {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Extract tenant information from session
    const user = session.user as any // We'll type this properly later
    const tenantId = user.tenantId
    const organizationId = user.organizationId
    
    if (!tenantId || !organizationId) {
      return NextResponse.json(
        { error: 'Invalid session - missing tenant information' },
        { status: 400 }
      )
    }

    // Get tenant database connection
    const tenantDb = await db.tenant(tenantId)
    
    // Get user details from tenant database
    const userDetails = await tenantDb.user.findUnique({
      where: { id: user.id },
      include: {
        stateBranch: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!userDetails) {
      return NextResponse.json(
        { error: 'User not found in tenant database' },
        { status: 404 }
      )
    }

    // Determine allowed states
    const allowedStates = await getAllowedStates(userDetails, tenantDb)
    
    // Extract permissions
    const permissions = extractPermissions(userDetails.userRoles)
    
    // Build tenant context
    const tenantContext: TenantContext = {
      tenantId,
      organizationId,
      userId: userDetails.id,
      stateBranchId: userDetails.stateBranchId,
      isStateRestricted: userDetails.isStateRestricted,
      allowedStates,
      role: userDetails.userRoles[0]?.role.name || 'GUEST_USER',
      permissions
    }

    return tenantContext

  } catch (error) {
    console.error('Tenant middleware error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get all states accessible to the user
 */
async function getAllowedStates(userDetails: any, tenantDb: any): Promise<string[]> {
  if (!userDetails.isStateRestricted) {
    // Tenant admin - get all state branches
    const allBranches = await tenantDb.stateBranch.findMany({
      where: { 
        organizationId: userDetails.organizationId,
        isActive: true 
      },
      select: { id: true }
    })
    return allBranches.map((branch: any) => branch.id)
  }
  
  // State-restricted user
  return userDetails.stateBranchId ? [userDetails.stateBranchId] : []
}

/**
 * Extract permissions from user roles
 */
function extractPermissions(userRoles: any[]): string[] {
  const permissions = new Set<string>()
  
  userRoles.forEach(userRole => {
    userRole.role.permissions.forEach((rolePermission: any) => {
      permissions.add(rolePermission.permission.name)
    })
  })
  
  return Array.from(permissions)
}

/**
 * State-based access control for database queries
 */
export class StateAccessControl {
  
  /**
   * Filter query results based on user's state access
   */
  static async filterByUserAccess<T extends Record<string, any>>(
    tenantContext: TenantContext,
    query: T
  ): Promise<T> {
    if (!tenantContext.isStateRestricted) {
      // Tenant admin - no filtering needed
      return query
    }

    // Apply state branch filtering
    return {
      ...query,
      where: {
        ...query.where,
        stateBranchId: { in: tenantContext.allowedStates }
      }
    } as T
  }

  /**
   * Check if user can access specific state branch
   */
  static canAccessState(tenantContext: TenantContext, stateBranchId: string): boolean {
    if (!tenantContext.isStateRestricted) {
      return true // Tenant admin can access all states
    }
    
    return tenantContext.allowedStates.includes(stateBranchId)
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(tenantContext: TenantContext, permission: string): boolean {
    return tenantContext.permissions.includes(permission)
  }

  /**
   * Check if user can perform action on module in specific scope
   */
  static canPerformAction(
    tenantContext: TenantContext,
    module: string,
    action: string,
    scope: string
  ): boolean {
    const permissionName = `${module}:${action}:${scope}`
    return this.hasPermission(tenantContext, permissionName)
  }

  /**
   * Validate state access for inter-state operations
   */
  static validateInterstateAccess(
    tenantContext: TenantContext,
    fromStateId: string,
    toStateId: string
  ): boolean {
    // User must have access to both states for inter-state operations
    return this.canAccessState(tenantContext, fromStateId) &&
           this.canAccessState(tenantContext, toStateId)
  }
}

/**
 * HOF to wrap API handlers with tenant context
 */
export function withTenantContext<T extends Record<string, any>>(
  handler: (req: NextRequest, context: TenantContext, params?: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, params?: T): Promise<NextResponse> => {
    const tenantContext = await tenantMiddleware(req)
    
    if (tenantContext instanceof NextResponse) {
      // Error response from middleware
      return tenantContext
    }
    
    return handler(req, tenantContext, params)
  }
}

/**
 * Permission checker middleware
 */
export function requirePermission(permission: string) {
  return function(
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value
    
    descriptor.value = function(req: NextRequest, context: TenantContext, ...args: any[]) {
      if (!StateAccessControl.hasPermission(context, permission)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
      
      return method.apply(this, [req, context, ...args])
    }
  }
}

/**
 * State access checker middleware
 */
export function requireStateAccess(getStateId: (context: TenantContext, args: any[]) => string) {
  return function(
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value
    
    descriptor.value = function(req: NextRequest, context: TenantContext, ...args: any[]) {
      const stateId = getStateId(context, args)
      
      if (!StateAccessControl.canAccessState(context, stateId)) {
        return NextResponse.json(
          { error: 'State access denied' },
          { status: 403 }
        )
      }
      
      return method.apply(this, [req, context, ...args])
    }
  }
}

/**
 * Audit logging for tenant actions
 */
export async function logTenantAction(
  tenantContext: TenantContext,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  try {
    const tenantDb = await db.tenant(tenantContext.tenantId)
    
    await tenantDb.auditLog.create({
      data: {
        organizationId: tenantContext.organizationId,
        action,
        entityType,
        entityId,
        userId: tenantContext.userId,
        newValues: details,
        success,
        errorMessage,
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('Failed to log tenant action:', error)
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}

 