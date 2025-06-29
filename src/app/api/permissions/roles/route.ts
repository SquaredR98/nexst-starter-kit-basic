/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// ROLE MANAGEMENT API - Create, Read, Update, Delete Roles
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
// import { CreateRoleRequest } from '@/types/abac';

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parentRoleId: z.string().optional(),
  permissions: z.array(z.object({
    permissionId: z.string(),
    conditions: z.record(z.any()).optional()
  })).default([])
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  parentRoleId: z.string().optional(),
  isActive: z.boolean().optional()
});

/**
 * GET /api/permissions/roles
 * List all roles for the organization with pagination
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

    // Check permission
    // For now, we'll allow any authenticated user to view roles
    // In production, you'd check for 'roles:read' permission

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const total = await prisma.role.count({ where });

    // Get roles with related data
    const roles = await prisma.role.findMany({
      where,
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        },
        _count: {
          select: {
            userRoles: { where: { isActive: true } }
          }
        }
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Format response
    const formattedRoles = roles.map((role: any) => ({
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      level: role.level,
      isSystemRole: role.isSystemRole,
      isActive: role.isActive,
      userCount: role._count.userRoles,
      permissionCount: role.permissions.length,
      permissions: role.permissions.map((rp: any) => ({
        id: rp.permission.id,
        module: rp.permission.module,
        resource: rp.permission.resource,
        action: rp.permission.action,
        scope: rp.permission.scope,
        description: rp.permission.description
      })),
      users: role.userRoles.map((ur: any) => ({
        id: ur.user.id,
        name: `${ur.user.firstName} ${ur.user.lastName}`,
        email: ur.user.email
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }));

    return NextResponse.json({
      roles: formattedRoles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get roles API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/permissions/roles
 * Create a new role
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

    // Check permission to create roles
    // For now, we'll allow organization admins
    // In production, check for 'roles:create' permission

    const body = await request.json();
    
    // Validate request body
    const validatedData = createRoleSchema.parse(body);

    // Check if role name already exists
    const existingRole = await prisma.role.findFirst({
      where: {
        organizationId: session.user.organizationId,
        name: validatedData.name
      }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role name already exists' },
        { status: 409 }
      );
    }

    // Generate role code from name
    const roleCode = validatedData.name.toLowerCase().replace(/\s+/g, '_');

    // Check if role code already exists
    const existingCodeRole = await prisma.role.findFirst({
      where: {
        organizationId: session.user.organizationId,
        code: roleCode
      }
    });

    if (existingCodeRole) {
      return NextResponse.json(
        { error: 'Role code already exists' },
        { status: 409 }
      );
    }

    // Create role in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the role
      const newRole = await tx.role.create({
        data: {
          organizationId: session.user.organizationId,
          name: validatedData.name,
          code: roleCode,
          description: validatedData.description,
          level: 4, // Default to organization level
          isSystemRole: false,
          isActive: true,
          createdById: session.user.id
        },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });

      // Assign permissions if provided
      if (validatedData.permissions.length > 0) {
        const rolePermissions = await Promise.all(
          validatedData.permissions.map(async (perm) => {
            // Verify permission exists
            const permission = await tx.permission.findUnique({
              where: { id: perm.permissionId }
            });

            if (!permission) {
              throw new Error(`Permission not found: ${perm.permissionId}`);
            }

            return tx.rolePermission.create({
              data: {
                roleId: newRole.id,
                permissionId: perm.permissionId,
                grantedById: session.user.id
              }
            });
          })
        );
      }

      return newRole;
    });

    return NextResponse.json({
      role: {
        id: result.id,
        name: result.name,
        code: result.code,
        description: result.description,
        level: result.level,
        isSystemRole: result.isSystemRole,
        isActive: result.isActive,
        createdAt: result.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create role API error:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
} 