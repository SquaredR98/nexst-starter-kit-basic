/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// CUSTOMER API - Example demonstrating ABAC permission enforcement
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ruleEngine } from '@/lib/abac/rule-engine';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Customer validation schema
const customerSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
  departmentId: z.string().optional(),
  assignedTo: z.string().optional(),
  creditLimit: z.number().default(0)
});

/**
 * GET /api/customers
 * List customers with ABAC permission checking
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permission to read customers
    const canReadCustomers = await ruleEngine.hasPermission(
      session.user.id,
      session.user.organizationId,
      'customers',
      'read'
    );

    if (!canReadCustomers) {
      return NextResponse.json(
        { error: 'Permission denied: cannot read customers' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Build where clause based on user's scope
    const userContext = await getUserContext(session.user.id, session.user.organizationId);
    const whereClause = await buildCustomerWhereClause(userContext);

    // Get customers
    const customers = await prisma.customer?.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }) || [];

    const total = await prisma.customer?.count({ where: whereClause }) || 0;

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers
 * Create new customer with ABAC permission checking
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permission to create customers
    const canCreateCustomers = await ruleEngine.hasPermission(
      session.user.id,
      session.user.organizationId,
      'customers',
      'create'
    );

    if (!canCreateCustomers) {
      return NextResponse.json(
        { error: 'Permission denied: cannot create customers' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    // Create customer in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the customer
      const newCustomer = await tx.customer?.create({
        data: {
          organizationId: session.user.organizationId,
          ...validatedData
        }
      });

      // Set resource attributes for ABAC
      if (validatedData.departmentId) {
        await tx.resourceAttribute.create({
          data: {
            organizationId: session.user.organizationId,
            resourceType: 'customers',
            resourceId: newCustomer.id,
            attributeName: 'department',
            attributeValue: validatedData.departmentId
          }
        });
      }

      // Set owner attribute
      await tx.resourceAttribute.create({
        data: {
          organizationId: session.user.organizationId,
          resourceType: 'customers',
          resourceId: newCustomer.id,
          attributeName: 'owner',
          attributeValue: session.user.id
        }
      });

      return newCustomer;
    });

    return NextResponse.json({
      customer: result
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get user context for permission scoping
 */
async function getUserContext(userId: string, organizationId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId },
    include: {
      userRoles: {
        where: { isActive: true },
        include: { role: true }
      },
      userAttributes: true,
      department: true
    }
  });

  if (!user) return null;

  const attributes: Record<string, string | string[]> = {};
  user.userAttributes.forEach((attr: any) => {
    attributes[attr.attributeName] = attr.attributeValue;
  });

  return {
    userId: user.id,
    organizationId: user.organizationId,
    roles: user.userRoles.map((ur: any) => ur.role.code),
    department: user.department?.code,
    teams: Array.isArray(attributes.teams) ? attributes.teams : [],
    attributes
  };
}

/**
 * Build where clause based on user's permission scope
 */
interface UserContext {
  userId: string;
  organizationId: string;
  roles: string[];
  department?: string;
  teams: string[];
  attributes: Record<string, string | string[]>;
}

async function buildCustomerWhereClause(userContext: UserContext | null) {
  if (!userContext) return { id: 'never' }; // No access

  const baseWhere = {
    organizationId: userContext.organizationId
  };

  // Check user's highest permission scope
  const roles = userContext.roles || [];

  // Global scope (super admin)
  if (roles.includes('super_admin')) {
    return {}; // No restrictions
  }

  // Organization scope (org admin, finance manager)
  if (roles.includes('organization_admin') || roles.includes('finance_manager')) {
    return baseWhere;
  }

  // Department scope (sales manager)
  if (roles.includes('sales_manager') && userContext.department) {
    return {
      ...baseWhere,
      // Add department filter via resource attributes
      resourceAttributes: {
        some: {
          attributeName: 'department',
          attributeValue: userContext.department
        }
      }
    };
  }

  // Personal scope (sales representative)
  if (roles.includes('sales_representative')) {
    return {
      ...baseWhere,
      // Only customers owned by this user
      resourceAttributes: {
        some: {
          attributeName: 'owner',
          attributeValue: userContext.userId
        }
      }
    };
  }

  // Default: no access
  return { id: 'never' };
}

// Example of more granular endpoint protection
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const customerId = body.id;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Check permission for specific customer update
    const decision = await ruleEngine.evaluateAccess({
      userId: session.user.id,
      organizationId: session.user.organizationId,
      resource: 'customers',
      action: 'update',
      resourceId: customerId,
      context: {
        method: 'PUT',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    if (decision.decision !== 'PERMIT') {
      return NextResponse.json({
        error: 'Permission denied',
        reason: decision.reason,
        evaluationTime: `${decision.evaluationTimeMs}ms`
      }, { status: 403 });
    }

    // Update customer logic here...
    const validatedData = customerSchema.partial().parse(body);

    const updatedCustomer = await prisma.customer?.update({
      where: { id: customerId },
      data: validatedData
    });

    return NextResponse.json({
      customer: updatedCustomer,
      permission: {
        decision: decision.decision,
        reason: decision.reason,
        evaluationTime: decision.evaluationTimeMs
      }
    });

  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
} 