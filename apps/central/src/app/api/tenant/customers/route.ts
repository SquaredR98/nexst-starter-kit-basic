/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { TenantDatabaseManager } from '@/lib/database/connection-manager'
// import { StateAccessControl, logTenantAction } from '@/lib/middleware/tenant-middleware'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  
  // Address information
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    stateCode: z.string().min(2, 'State code is required').max(2),
    pinCode: z.string().min(6, 'Pin code must be at least 6 characters'),
    country: z.string().default('India')
  }),
  
  // Business information
  customerType: z.enum(['INDIVIDUAL', 'COMPANY', 'PARTNERSHIP', 'LLP', 'TRUST']),
  businessCategory: z.string().optional(),
  creditLimit: z.number().optional(),
  creditDays: z.number().optional(),
  
  // GST information
  gstRegistrationType: z.enum(['REGISTERED', 'UNREGISTERED', 'COMPOSITION']).optional(),
  
  // State branch assignment
  stateBranchId: z.string().min(1, 'State branch is required')
})

// const updateCustomerSchema = createCustomerSchema.partial()

/**
 * GET /api/tenant/customers
 * List customers with state-based filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const stateCode = searchParams.get('stateCode') || ''
    const customerType = searchParams.get('customerType') || ''
    
    const skip = (page - 1) * limit
    
    // Get tenant database connection
    const tenantDb = await TenantDatabaseManager.getConnection(session.user.tenantId)
    
    // Build filters with state access control
    const where: Record<string, any> = {}
    
    // Apply state-based filtering
    if (session.user.isStateRestricted) {
      where.stateBranch = {
        stateCode: {
          in: session.user.accessibleStates
        }
      }
    }
    
    // Apply state filter if provided
    if (stateCode) {
      // For state filtering, we'll validate against user's accessible states
      if (session.user.isStateRestricted && !session.user.accessibleStates.includes(stateCode)) {
        return NextResponse.json(
          { success: false, error: 'Access denied to specified state' },
          { status: 403 }
        )
      }
      where.stateBranch = {
        ...where.stateBranch,
        stateCode
      }
    }
    
    // Apply search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
        { gstNumber: { contains: search, mode: 'insensitive' as const } },
        { customerCode: { contains: search, mode: 'insensitive' as const } }
      ]
    }
    
    // Apply customer type filter
    if (customerType) {
      where.customerType = customerType
    }
    
    // Add organization filter
    where.organizationId = session.user.organizationId
    where.isActive = true
    
    const [customers, total] = await Promise.all([
      tenantDb.customer.findMany({
        where,
        include: {
          stateBranch: {
            select: {
              id: true,
              stateName: true,
              stateCode: true,
              branchName: true,
              branchCode: true
            }
          },
          transactions: {
            select: {
              id: true,
              amount: true,
              dueAmount: true,
              status: true
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      tenantDb.customer.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        customers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tenant/customers
 * Create new customer with state validation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createCustomerSchema.parse(body)
    
    // Get tenant database connection
    const tenantDb = await TenantDatabaseManager.getConnection(session.user.tenantId)
    // Validate state branch access
    const stateBranch = await tenantDb.stateBranch.findUnique({
      where: { 
        id: validatedData.stateBranchId,
        organizationId: session.user.organizationId,
        isActive: true 
      }
    })
    
    if (!stateBranch) {
      return NextResponse.json(
        { success: false, error: 'Invalid state branch' },
        { status: 400 }
      )
    }
    
    // Check user access to state
    if (session.user.isStateRestricted && !session.user.accessibleStates.includes(stateBranch.stateCode)) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this state branch' },
        { status: 403 }
      )
    }
    
    // Validate address state matches branch state
    if (validatedData.address.stateCode !== stateBranch.stateCode) {
      return NextResponse.json(
        { success: false, error: 'Customer address state must match selected branch state' },
        { status: 400 }
      )
    }
    
    // Check for duplicate GST number within organization
    if (validatedData.gstNumber) {
      const existingGST = await tenantDb.customer.findFirst({
        where: {
          gstNumber: validatedData.gstNumber,
          organizationId: session.user.organizationId,
          isActive: true
        }
      })
      
      if (existingGST) {
        return NextResponse.json(
          { success: false, error: 'GST number already exists' },
          { status: 400 }
        )
      }
    }
    
    // Generate customer code
    const customerCount = await tenantDb.customer.count({
      where: {
        organizationId: session.user.organizationId,
        stateBranchId: validatedData.stateBranchId
      }
    })
    
    const customerCode = `${stateBranch.branchCode}-CUS-${String(customerCount + 1).padStart(5, '0')}`
    
    // Create customer
    const customer = await tenantDb.customer.create({
      data: {
        organizationId: session.user.organizationId,
        stateBranchId: validatedData.stateBranchId,
        customerCode,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        gstNumber: validatedData.gstNumber,
        panNumber: validatedData.panNumber,
        address: validatedData.address,
        customerType: validatedData.customerType,
        businessCategory: validatedData.businessCategory,
        creditLimit: validatedData.creditLimit || 0,
        creditDays: validatedData.creditDays || 0,
        gstRegistrationType: validatedData.gstRegistrationType || 'UNREGISTERED',
        isActive: true,
        createdBy: session.user.id,
        updatedBy: session.user.id
      },
      include: {
        stateBranch: {
          select: {
            id: true,
            stateName: true,
            stateCode: true,
            branchName: true,
            branchCode: true
          }
        }
      }
    })
    
    // TODO: Add audit trail logging
    
    return NextResponse.json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating customer:', error)
    
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
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    )
  }
} 