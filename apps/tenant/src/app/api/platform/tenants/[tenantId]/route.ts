import { NextRequest, NextResponse } from 'next/server'
import { CentralDatabaseManager, TenantDatabaseManager } from '@/lib/database/connection-manager'
import { z } from 'zod'

// Validation schema for tenant updates
const updateTenantSchema = z.object({
  companyName: z.string().min(2).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  industry: z.string().optional(),
  corporateGST: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional()
})

/**
 * GET /api/platform/tenants/[tenantId]
 * Get specific tenant details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params
    const central = CentralDatabaseManager.getInstance()
    
    // TODO: Add platform admin authentication check here
    
    const tenant = await central.platformTenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: {
            plan: true
          }
        },
        stateBranches: {
          orderBy: { createdAt: 'desc' }
        },
        apiKeys: {
          select: {
            id: true,
            name: true,
            keyPrefix: true,
            permissions: true,
            isActive: true,
            lastUsedAt: true,
            createdAt: true,
            expiresAt: true
          }
        }
      }
    })
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...tenant,
        databaseConfig: undefined // Don't expose credentials
      }
    })
    
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenant' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/platform/tenants/[tenantId]
 * Update tenant details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params
    const body = await request.json()
    
    // Validate request data
    const validatedData = updateTenantSchema.parse(body)
    
    const central = CentralDatabaseManager.getInstance()
    
    // Check if tenant exists
    const existingTenant = await central.platformTenant.findUnique({
      where: { id: tenantId }
    })
    
    if (!existingTenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // Check email uniqueness if being updated
    if (validatedData.contactEmail && validatedData.contactEmail !== existingTenant.contactEmail) {
      const existingEmail = await central.platformTenant.findFirst({
        where: { 
          contactEmail: validatedData.contactEmail,
          id: { not: tenantId }
        }
      })
      
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: 'Contact email already exists' },
          { status: 400 }
        )
      }
    }
    
    // Update tenant
    const updatedTenant = await central.platformTenant.update({
      where: { id: tenantId },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        subscription: {
          include: {
            plan: true
          }
        },
        stateBranches: true
      }
    })
    
    // Update organization in tenant database if name changed
    if (validatedData.companyName && validatedData.companyName !== existingTenant.companyName) {
      try {
        const tenantDb = await TenantDatabaseManager.getConnection(tenantId)
        await tenantDb.organization.updateMany({
          where: { platformTenantId: tenantId },
          data: {
            name: validatedData.companyName,
            updatedAt: new Date()
          }
        })
      } catch (dbError) {
        console.error('Error updating tenant database organization:', dbError)
        // Continue - central DB is updated, tenant DB update failed
      }
    }
    
    // Log audit trail
    await central.platformAuditLog.create({
      data: {
        tenantId,
        action: 'TENANT_UPDATED',
        entityType: 'tenant',
        entityId: tenantId,
        performedBy: 'SYSTEM', // TODO: Replace with actual user
        performedByType: 'PLATFORM_ADMIN',
        details: validatedData,
        success: true,
        timestamp: new Date()
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Tenant updated successfully',
      data: updatedTenant
    })
    
  } catch (error) {
    console.error('Error updating tenant:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update tenant' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/platform/tenants/[tenantId]
 * Soft delete tenant (deactivate)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params
    const central = CentralDatabaseManager.getInstance()
    
    // TODO: Add platform admin authentication check here
    
    // Check if tenant exists
    const existingTenant = await central.platformTenant.findUnique({
      where: { id: tenantId }
    })
    
    if (!existingTenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    if (!existingTenant.isActive) {
      return NextResponse.json(
        { success: false, error: 'Tenant is already deactivated' },
        { status: 400 }
      )
    }
    
    // Soft delete (deactivate) tenant
    const deactivatedTenant = await central.platformTenant.update({
      where: { id: tenantId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    // Deactivate organization in tenant database
    try {
      const tenantDb = await TenantDatabaseManager.getConnection(tenantId)
      await tenantDb.organization.updateMany({
        where: { platformTenantId: tenantId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })
      
      // Deactivate all users in tenant database
      await tenantDb.user.updateMany({
        where: { organization: { platformTenantId: tenantId } },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })
      
    } catch (dbError) {
      console.error('Error deactivating tenant database records:', dbError)
      // Continue - central DB is updated
    }
    
    // Remove tenant connection
    await TenantDatabaseManager.removeConnection(tenantId)
    
    // Log audit trail
    await central.platformAuditLog.create({
      data: {
        tenantId,
        action: 'TENANT_DEACTIVATED',
        entityType: 'tenant',
        entityId: tenantId,
        performedBy: 'SYSTEM', // TODO: Replace with actual user
        performedByType: 'PLATFORM_ADMIN',
        details: {
          companyName: existingTenant.companyName,
          contactEmail: existingTenant.contactEmail
        },
        success: true,
        timestamp: new Date()
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Tenant deactivated successfully',
      data: deactivatedTenant
    })
    
  } catch (error) {
    console.error('Error deactivating tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate tenant' },
      { status: 500 }
    )
  }
} 