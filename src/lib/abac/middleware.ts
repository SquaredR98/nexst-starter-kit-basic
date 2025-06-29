// ============================================================================
// ABAC MIDDLEWARE - Permission Enforcement for Next.js API Routes
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ruleEngine } from './rule-engine';
import { AccessRequest } from '@/types/abac';

/**
 * Middleware factory to create permission-checking middleware
 */
export function requirePermission(resource: string, action: string) {
  return async function permissionMiddleware(
    request: NextRequest,
    context: { params?: Record<string, string> }
  ) {
    try {
      // Get session from NextAuth
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Extract resource ID from URL params or request body
      let resourceId: string | undefined;
      
      // Try to get resourceId from URL params first
      if (context.params?.id) {
        resourceId = context.params.id;
      } else if (context.params) {
        // Check for common resource ID patterns
        const idKeys = ['id', 'userId', 'customerId', 'productId', 'projectId'];
        for (const key of idKeys) {
          if (context.params[key]) {
            resourceId = context.params[key];
            break;
          }
        }
      }

      // If no resourceId from params, try to get from request body (for POST/PUT)
      if (!resourceId && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.json();
          resourceId = body.id;
        } catch {
          // Continue without resourceId if body parsing fails
        }
      }

      // Create access request
      const accessRequest: AccessRequest = {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        resource,
        action,
        resourceId,
        context: {
          method: request.method,
          url: request.url,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      };

      // Evaluate permission
      const decision = await ruleEngine.evaluateAccess(accessRequest);

      if (decision.decision !== 'PERMIT') {
        return NextResponse.json(
          { 
            error: 'Access denied',
            reason: decision.reason,
            resource,
            action
          },
          { status: 403 }
        );
      }

      // Permission granted - continue to the API route
      return NextResponse.next();

    } catch (error) {
      console.error('Permission middleware error:', error);
      return NextResponse.json(
        { error: 'Permission evaluation failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function to wrap API route handlers with permission checking
 */
export function withPermission(
  resource: string, 
  action: string,
  handler: (req: NextRequest, context: { params?: Record<string, string> }) => Promise<NextResponse>
) {
  return async function wrappedHandler(req: NextRequest, context: { params?: Record<string, string> }) {
    const permissionCheck = requirePermission(resource, action);
    const permissionResult = await permissionCheck(req, context);
    
    // If permission check returns a response, it means access was denied
    if (permissionResult.status !== 200) {
      return permissionResult;
    }
    
    // Permission granted, execute the original handler
    return handler(req, context);
  };
}

/**
 * Role-based route protection (simpler alternative)
 */
export function requireRole(...roles: string[]) {
  return async function roleMiddleware(_request: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const userRoles = session.user.roles || [];
      const userRoleCodes = userRoles.map(r => typeof r === 'string' ? r : r.code);
      const hasRequiredRole = roles.some(role => userRoleCodes.includes(role));

      if (!hasRequiredRole) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions',
            requiredRoles: roles,
            userRoles 
          },
          { status: 403 }
        );
      }

      return NextResponse.next();

    } catch (error) {
      console.error('Role middleware error:', error);
      return NextResponse.json(
        { error: 'Authorization check failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if current user has specific permission
 */
export async function checkPermission(
  resource: string, 
  action: string, 
  resourceId?: string
): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return false;
    }

    return await ruleEngine.hasPermission(
      session.user.id,
      session.user.organizationId,
      resource,
      action,
      resourceId
    );
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Get current user's permissions for a resource
 */
export async function getUserPermissions(resource: string): Promise<string[]> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return [];
    }

    return await ruleEngine.getUserPermissions(
      session.user.id,
      session.user.organizationId,
      resource
    );
  } catch (error) {
    console.error('Get user permissions error:', error);
    return [];
  }
}

/**
 * Organization context middleware - ensures user belongs to the organization
 */
export function requireOrganization() {
  return async function organizationMiddleware(
    _request: NextRequest,
    context: { params?: Record<string, string> }
  ) {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Extract organization ID from URL params
      const orgId = context.params?.organizationId || context.params?.orgId;
      
      if (orgId && orgId !== session.user.organizationId) {
        return NextResponse.json(
          { error: 'Access to this organization is not allowed' },
          { status: 403 }
        );
      }

      return NextResponse.next();

    } catch (error) {
      console.error('Organization middleware error:', error);
      return NextResponse.json(
        { error: 'Organization check failed' },
        { status: 500 }
      );
    }
  };
} 