/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { CentralDatabaseManager, TenantDatabaseManager } from '@/lib/database/connection-manager'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Validation schemas
const createTenantSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().optional(),
  industry: z.string().optional(),
  corporateGST: z.string().optional(),
  country: z.string().default('IN'),
  currency: z.string().default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
  
  // Database configuration
  databaseConfig: z.object({
    host: z.string().min(1, 'Database host is required'),
    port: z.number().int().min(1).max(65535),
    database: z.string().min(1, 'Database name is required'),
    username: z.string().min(1, 'Database username is required'),
    password: z.string().min(1, 'Database password is required'),
    ssl: z.boolean().optional()
  }),
  
  // Initial admin user
  adminUser: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().optional()
  }),
  
  // Initial state branch
  initialBranch: z.object({
    stateName: z.string().min(1, 'State name is required'),
    stateCode: z.string().min(2, 'State code is required'),
    gstNumber: z.string().optional(),
    branchName: z.string().min(1, 'Branch name is required'),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      pinCode: z.string(),
      country: z.string().default('India')
    })
  })
})

/**
 * GET /api/platform/tenants
 * List all tenants (platform admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const central = CentralDatabaseManager.getInstance()
    
    // TODO: Add platform admin authentication check here
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    
    const skip = (page - 1) * limit
    
    const where = search ? {
      OR: [
        { companyName: { contains: search, mode: 'insensitive' as const } },
        { contactEmail: { contains: search, mode: 'insensitive' as const } },
        { slug: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}
    
    const [tenants, total] = await Promise.all([
      central.platformTenant.findMany({
        where,
        include: {
          subscription: {
            include: {
              plan: true
            }
          },
          stateBranches: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      central.platformTenant.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        tenants,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/platform/tenants
 * Register a new tenant with database setup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validatedData = createTenantSchema.parse(body)
    
    const central = CentralDatabaseManager.getInstance()
    
    // Check if slug is unique
    const existingTenant = await central.platformTenant.findUnique({
      where: { slug: validatedData.slug }
    })
    
    if (existingTenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant slug already exists' },
        { status: 400 }
      )
    }
    
    // Check if contact email is unique
    const existingEmail = await central.platformTenant.findFirst({
      where: { contactEmail: validatedData.contactEmail }
    })
    
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Contact email already exists' },
        { status: 400 }
      )
    }
    
    // Start transaction for tenant creation
    const result = await central.$transaction(async (tx: any) => {
      
      // 1. Encrypt database credentials
      const encryptedCredentials = TenantDatabaseManager.encryptCredentials(validatedData.databaseConfig)
      
      // 2. Create platform tenant record
      const tenant = await tx.platformTenant.create({
        data: {
          companyName: validatedData.companyName,
          slug: validatedData.slug,
          contactEmail: validatedData.contactEmail,
          contactPhone: validatedData.contactPhone,
          industry: validatedData.industry,
          corporateGST: validatedData.corporateGST,
          country: validatedData.country,
          currency: validatedData.currency,
          timezone: validatedData.timezone,
          databaseConfig: encryptedCredentials,
          databaseStatus: 'CONNECTING',
          onboardingStatus: 'DATABASE_SETUP',
          isActive: true,
          isPlatformManaged: false // Assuming customer provides their own DB
        }
      })
      
      // 3. Create initial state branch record in central DB
      const stateBranch = await tx.platformStateBranch.create({
        data: {
          tenantId: tenant.id,
          stateName: validatedData.initialBranch.stateName,
          stateCode: validatedData.initialBranch.stateCode,
          gstNumber: validatedData.initialBranch.gstNumber || '',
          branchName: validatedData.initialBranch.branchName,
          address: validatedData.initialBranch.address,
          isHeadOffice: true,
          isActive: true,
          gstConfiguration: {} // Will be populated later
        }
      })
      
      return { tenant, stateBranch }
    })
    
    // 4. Validate tenant database connection
    try {
      const isValidConnection = await TenantDatabaseManager.validateConnection(validatedData.databaseConfig)
      
      if (!isValidConnection) {
        // Update status to failed
        await central.platformTenant.update({
          where: { id: result.tenant.id },
          data: { 
            databaseStatus: 'FAILED',
            onboardingStatus: 'FAILED'
          }
        })
        
        return NextResponse.json(
          { success: false, error: 'Unable to connect to tenant database. Please check credentials.' },
          { status: 400 }
        )
      }
      
      // 5. Create tenant database schema and initial data
      await TenantDatabaseManager.createTenantSchema(result.tenant.id)
      
      // 6. Get tenant database connection and set up initial data
      const tenantDb = await TenantDatabaseManager.getConnection(result.tenant.id)
      
      // Create organization in tenant database
      const organization = await tenantDb.organization.create({
        data: {
          name: validatedData.companyName,
          slug: validatedData.slug,
          industry: validatedData.industry,
          country: validatedData.country,
          currency: validatedData.currency,
          timezone: validatedData.timezone,
          platformTenantId: result.tenant.id,
          isActive: true
        }
      })
      
      // Create state branch in tenant database
      const tenantStateBranch = await tenantDb.stateBranch.create({
        data: {
          organizationId: organization.id,
          stateName: validatedData.initialBranch.stateName,
          stateCode: validatedData.initialBranch.stateCode,
          gstNumber: validatedData.initialBranch.gstNumber || '',
          branchName: validatedData.initialBranch.branchName,
          branchCode: 'HQ',
          address: validatedData.initialBranch.address,
          pinCode: validatedData.initialBranch.address.pinCode,
          city: validatedData.initialBranch.address.city,
          isHeadOffice: true,
          isActive: true,
          gstConfiguration: {}
        }
      })
      
      // Create admin user in tenant database
      const hashedPassword = await bcrypt.hash(validatedData.adminUser.password, 12)
      
      const adminUser = await tenantDb.user.create({
        data: {
          organizationId: organization.id,
          email: validatedData.adminUser.email,
          firstName: validatedData.adminUser.firstName,
          lastName: validatedData.adminUser.lastName,
          phone: validatedData.adminUser.phone,
          passwordHash: hashedPassword,
          stateBranchId: null, // Tenant admin can access all states
          isStateRestricted: false,
          isActive: true,
          employeeId: 'ADM001',
          designation: 'Tenant Administrator'
        }
      })
      
      // TODO: Create default roles and assign to admin user
      
      // 7. Update tenant status to completed
      await central.platformTenant.update({
        where: { id: result.tenant.id },
        data: { 
          databaseStatus: 'CONNECTED',
          onboardingStatus: 'COMPLETED',
          lastConnectedAt: new Date()
        }
      })
      
      // 8. Log audit trail
      await central.platformAuditLog.create({
        data: {
          tenantId: result.tenant.id,
          action: 'TENANT_CREATED',
          entityType: 'tenant',
          entityId: result.tenant.id,
          performedBy: 'SYSTEM',
          performedByType: 'SYSTEM',
          details: {
            companyName: validatedData.companyName,
            contactEmail: validatedData.contactEmail,
            stateBranches: 1
          },
          success: true,
          timestamp: new Date()
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Tenant created successfully',
        data: {
          tenantId: result.tenant.id,
          slug: result.tenant.slug,
          organizationId: organization.id,
          adminUserId: adminUser.id,
          stateBranchId: tenantStateBranch.id,
          databaseStatus: 'CONNECTED',
          onboardingStatus: 'COMPLETED'
        }
      }, { status: 201 })
      
    } catch (dbError) {
      console.error('Database setup error:', dbError)
      
      // Update status to failed
      await central.platformTenant.update({
        where: { id: result.tenant.id },
        data: { 
          databaseStatus: 'FAILED',
          onboardingStatus: 'FAILED'
        }
      })
      
      return NextResponse.json(
        { success: false, error: 'Failed to set up tenant database schema' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Error creating tenant:', error)
    
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
      { success: false, error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
} 