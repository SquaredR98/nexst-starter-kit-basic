/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// PERMISSION CHECK API - Single and Bulk Permission Verification
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ruleEngine } from '@/lib/abac/rule-engine';
import { z } from 'zod';
import { 
  // CheckPermissionRequest, 
  CheckPermissionResponse,
  // BulkPermissionCheckRequest,
  BulkPermissionCheckResponse
} from '@/types/abac';

// Validation schemas
const singlePermissionSchema = z.object({
  resource: z.string(),
  action: z.string(),
  resourceId: z.string().optional(),
  context: z.record(z.any()).optional()
});

const bulkPermissionSchema = z.object({
  permissions: z.array(singlePermissionSchema)
});

/**
 * POST /api/permissions/check
 * Check single or multiple permissions for the current user
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Check if this is a bulk permission check
    if (body.permissions && Array.isArray(body.permissions)) {
      return handleBulkPermissionCheck(body, session);
    } else {
      return handleSinglePermissionCheck(body, session);
    }

  } catch (error) {
    console.error('Permission check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle single permission check
 */
async function handleSinglePermissionCheck(
  body: any,
  session: any
): Promise<NextResponse> {
  try {
    // Validate request body
    const validatedData = singlePermissionSchema.parse(body);

    // Create access request
    const accessRequest = {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      resource: validatedData.resource,
      action: validatedData.action,
      resourceId: validatedData.resourceId,
      context: validatedData.context
    };

    // Evaluate permission
    const decision = await ruleEngine.evaluateAccess(accessRequest);

    const response: CheckPermissionResponse = {
      permitted: decision.decision === 'PERMIT',
      decision: decision.decision,
      reason: decision.reason,
      evaluationTimeMs: decision.evaluationTimeMs
    };

    return NextResponse.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Single permission check error:', error);
    return NextResponse.json(
      { error: 'Permission evaluation failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle bulk permission check
 */
async function handleBulkPermissionCheck(
  body: any,
  session: any
): Promise<NextResponse> {
  try {
    // Validate request body
    const validatedData = bulkPermissionSchema.parse(body);

    const results = [];

    // Process each permission check
    for (const permissionCheck of validatedData.permissions) {
      const accessRequest = {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        resource: permissionCheck.resource,
        action: permissionCheck.action,
        resourceId: permissionCheck.resourceId,
        context: permissionCheck.context
      };

      const decision = await ruleEngine.evaluateAccess(accessRequest);

      results.push({
        resource: permissionCheck.resource,
        action: permissionCheck.action,
        resourceId: permissionCheck.resourceId,
        permitted: decision.decision === 'PERMIT',
        decision: decision.decision,
        reason: decision.reason,
        evaluationTimeMs: decision.evaluationTimeMs
      });
    }

    const response: BulkPermissionCheckResponse = { results };

    return NextResponse.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Bulk permission check error:', error);
    return NextResponse.json(
      { error: 'Bulk permission evaluation failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/permissions/check?resource=users&action=read&resourceId=123
 * Quick permission check via query parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const action = searchParams.get('action');
    const resourceId = searchParams.get('resourceId');

    if (!resource || !action) {
      return NextResponse.json(
        { error: 'resource and action parameters are required' },
        { status: 400 }
      );
    }

    // Check permission
    const hasPermission = await ruleEngine.hasPermission(
      session.user.id,
      session.user.organizationId,
      resource,
      action,
      resourceId || undefined
    );

    return NextResponse.json({
      permitted: hasPermission,
      resource,
      action,
      resourceId
    });

  } catch (error) {
    console.error('GET permission check error:', error);
    return NextResponse.json(
      { error: 'Permission check failed' },
      { status: 500 }
    );
  }
} 