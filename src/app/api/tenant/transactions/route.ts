/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { TenantDatabaseManager } from '@/lib/database/connection-manager'
import { GSTCalculationEngine, /* InterstateTransactionManager */ } from '@/lib/gst/calculation-engine'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Validation schemas
const transactionItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  discount: z.number().min(0).max(100).optional(),
  hsnCode: z.string().optional(),
  sacCode: z.string().optional(),
  gstRate: z.number().min(0).max(28).optional() // Will be fetched if not provided
})

const createTransactionSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  supplierId: z.string().optional(),
  transactionType: z.enum(['SALE', 'PURCHASE', 'SALE_RETURN', 'PURCHASE_RETURN']),
  transactionDate: z.string().transform((str) => new Date(str)),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  
  // Reference information
  referenceNumber: z.string().optional(),
  poNumber: z.string().optional(),
  
  // State information for GST calculation
  fromStateBranchId: z.string().min(1, 'From state branch is required'),
  toStateBranchId: z.string().optional(), // For interstate transactions
  
  // Transaction items
  items: z.array(transactionItemSchema).min(1, 'At least one item is required'),
  
  // Additional charges
  shippingCharge: z.number().min(0).optional(),
  packingCharge: z.number().min(0).optional(),
  otherCharges: z.number().min(0).optional(),
  
  // Payment terms
  paymentTerms: z.enum(['CASH', 'CREDIT', 'PARTIAL']).default('CREDIT'),
  advanceAmount: z.number().min(0).optional(),
  
  // Notes
  notes: z.string().optional(),
  internalNotes: z.string().optional()
})

/**
 * GET /api/tenant/transactions
 * List transactions with state-based filtering
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
    const transactionType = searchParams.get('transactionType') || ''
    const status = searchParams.get('status') || ''
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    
    const skip = (page - 1) * limit
    
    // Get tenant database connection
    const tenantDb = await TenantDatabaseManager.getConnection(session.user.tenantId)
    
    // Build filters with state access control
    const where: Record<string, any> = {
      organizationId: session.user.organizationId
    }
    
    // Apply state-based filtering for state-restricted users
    if (session.user.isStateRestricted) {
      where.fromStateBranch = {
        stateCode: {
          in: session.user.accessibleStates
        }
      }
    }
    
    // Apply state filter if provided
    if (stateCode) {
      if (session.user.isStateRestricted && !session.user.accessibleStates.includes(stateCode)) {
        return NextResponse.json(
          { success: false, error: 'Access denied to specified state' },
          { status: 403 }
        )
      }
      where.fromStateBranch = {
        ...where.fromStateBranch,
        stateCode
      }
    }
    
    // Apply search filter
    if (search) {
      where.OR = [
        { transactionNumber: { contains: search, mode: 'insensitive' as const } },
        { referenceNumber: { contains: search, mode: 'insensitive' as const } },
        { poNumber: { contains: search, mode: 'insensitive' as const } },
        { customer: { name: { contains: search, mode: 'insensitive' as const } } },
        { supplier: { name: { contains: search, mode: 'insensitive' as const } } }
      ]
    }
    
    // Apply transaction type filter
    if (transactionType) {
      where.transactionType = transactionType
    }
    
    // Apply status filter
    if (status) {
      where.status = status
    }
    
    // Apply date range filter
    if (fromDate || toDate) {
      where.transactionDate = {}
      if (fromDate) {
        where.transactionDate.gte = new Date(fromDate)
      }
      if (toDate) {
        where.transactionDate.lte = new Date(toDate)
      }
    }
    
    const [transactions, total] = await Promise.all([
      tenantDb.transaction.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              customerCode: true,
              gstNumber: true
            }
          },
          supplier: {
            select: {
              id: true,
              name: true,
              supplierCode: true,
              gstNumber: true
            }
          },
          fromStateBranch: {
            select: {
              id: true,
              stateName: true,
              stateCode: true,
              branchName: true,
              branchCode: true
            }
          },
          toStateBranch: {
            select: {
              id: true,
              stateName: true,
              stateCode: true,
              branchName: true,
              branchCode: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  hsnCode: true,
                  sacCode: true
                }
              }
            }
          },
          gstCalculations: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      tenantDb.transaction.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tenant/transactions
 * Create new transaction with GST calculations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createTransactionSchema.parse(body)
    
    // Get tenant database connection
    const tenantDb = await TenantDatabaseManager.getConnection(session.user.tenantId)
    
    // Validate customer/supplier exists and user has access
    let customer = null
    let supplier = null
    
    if (validatedData.customerId) {
      customer = await tenantDb.customer.findUnique({
        where: { 
          id: validatedData.customerId,
          organizationId: session.user.organizationId,
          isActive: true 
        },
        include: {
          stateBranch: true
        }
      })
      
      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 400 }
        )
      }
    }
    
    if (validatedData.supplierId) {
      supplier = await tenantDb.supplier.findUnique({
        where: { 
          id: validatedData.supplierId,
          organizationId: session.user.organizationId,
          isActive: true 
        },
        include: {
          stateBranch: true
        }
      })
      
      if (!supplier) {
        return NextResponse.json(
          { success: false, error: 'Supplier not found' },
          { status: 400 }
        )
      }
    }
    
    // Validate state branches
    const fromStateBranch = await tenantDb.stateBranch.findUnique({
      where: { 
        id: validatedData.fromStateBranchId,
        organizationId: session.user.organizationId,
        isActive: true 
      }
    })
    
    if (!fromStateBranch) {
      return NextResponse.json(
        { success: false, error: 'Invalid from state branch' },
        { status: 400 }
      )
    }
    
    // Check user access to from state
    if (session.user.isStateRestricted && !session.user.accessibleStates.includes(fromStateBranch.stateCode)) {
      return NextResponse.json(
        { success: false, error: 'Access denied to from state branch' },
        { status: 403 }
      )
    }
    
    let toStateBranch = null
    if (validatedData.toStateBranchId) {
      toStateBranch = await tenantDb.stateBranch.findUnique({
        where: { 
          id: validatedData.toStateBranchId,
          organizationId: session.user.organizationId,
          isActive: true 
        }
      })
      
      if (!toStateBranch) {
        return NextResponse.json(
          { success: false, error: 'Invalid to state branch' },
          { status: 400 }
        )
      }
    }
    
    // Generate transaction number
    const transactionCount = await tenantDb.transaction.count({
      where: {
        organizationId: session.user.organizationId,
        fromStateBranchId: validatedData.fromStateBranchId,
        transactionType: validatedData.transactionType
      }
    })
    
    const typePrefix = {
      'SALE': 'INV',
      'PURCHASE': 'PUR', 
      'SALE_RETURN': 'SRN',
      'PURCHASE_RETURN': 'PRN'
    }[validatedData.transactionType]
    
    const transactionNumber = `${fromStateBranch.branchCode}-${typePrefix}-${String(transactionCount + 1).padStart(6, '0')}`
    
    // Validate and enrich items with product data
    const enrichedItems = await Promise.all(
      validatedData.items.map(async (item) => {
        const product = await tenantDb.product.findUnique({
          where: { 
            id: item.productId,
            organizationId: session.user.organizationId,
            isActive: true 
          }
        })
        
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`)
        }
        
        return {
          ...item,
          hsnCode: item.hsnCode || product.hsnCode,
          sacCode: item.sacCode || product.sacCode,
          baseAmount: item.quantity * item.unitPrice,
          discountAmount: item.discount ? (item.quantity * item.unitPrice * item.discount / 100) : 0
        }
      })
    )
    
    // Calculate GST using the GST calculation engine
    const isInterstate = toStateBranch && fromStateBranch.stateCode !== toStateBranch.stateCode
    
    // Calculate GST for each item
    const gstCalculations: any[] = []
    let totalGST = 0
    
    for (const item of enrichedItems) {
      const gstInput = {
        fromStateId: validatedData.fromStateBranchId,
        toStateId: validatedData.toStateBranchId,
        taxableAmount: item.baseAmount - item.discountAmount,
        hsnCode: item.hsnCode,
        isExport: false,
        isImport: false
      }
      
      const gstResult = await GSTCalculationEngine.calculateGST(session.user.tenantId, gstInput)
      
      gstCalculations.push({
        hsnCode: item.hsnCode || '',
        sacCode: item.sacCode || '',
        gstRate: gstResult.applicableGSTRate,
        taxableAmount: gstResult.taxableAmount,
        cgstAmount: gstResult.cgstAmount,
        sgstAmount: gstResult.sgstAmount,
        igstAmount: gstResult.igstAmount,
        totalGstAmount: gstResult.totalTaxAmount,
        gstType: gstResult.transactionType
      })
      
      totalGST += gstResult.totalTaxAmount
    }
    
    // Calculate totals
    const subtotal = enrichedItems.reduce((sum, item) => sum + item.baseAmount - item.discountAmount, 0)
    const totalCharges = (validatedData.shippingCharge || 0) + (validatedData.packingCharge || 0) + (validatedData.otherCharges || 0)
    const grandTotal = subtotal + totalCharges + totalGST
    const dueAmount = grandTotal - (validatedData.advanceAmount || 0)
    
    // Create transaction with all related data
    const transaction = await tenantDb.$transaction(async (tx: any) => {
      
      // Create main transaction record
      const newTransaction = await tx.transaction.create({
        data: {
          organizationId: session.user.organizationId,
          transactionNumber,
          transactionType: validatedData.transactionType,
          transactionDate: validatedData.transactionDate,
          dueDate: validatedData.dueDate,
          
          customerId: validatedData.customerId,
          supplierId: validatedData.supplierId,
          
          fromStateBranchId: validatedData.fromStateBranchId,
          toStateBranchId: validatedData.toStateBranchId,
          
          referenceNumber: validatedData.referenceNumber,
          poNumber: validatedData.poNumber,
          
          subtotal,
          shippingCharge: validatedData.shippingCharge || 0,
          packingCharge: validatedData.packingCharge || 0,
          otherCharges: validatedData.otherCharges || 0,
          totalCharges,
          totalGST,
          grandTotal,
          advanceAmount: validatedData.advanceAmount || 0,
          dueAmount,
          
          paymentTerms: validatedData.paymentTerms,
          status: dueAmount > 0 ? 'PENDING' : 'PAID',
          
          notes: validatedData.notes,
          internalNotes: validatedData.internalNotes,
          
          isInterstate,
          
          createdBy: session.user.id,
          updatedBy: session.user.id
        }
      })
      
      // Create transaction items
      const transactionItems = await Promise.all(
        enrichedItems.map((item, index) =>
          tx.transactionItem.create({
            data: {
              transactionId: newTransaction.id,
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              baseAmount: item.baseAmount,
              discount: item.discount || 0,
              discountAmount: item.discountAmount,
              netAmount: item.baseAmount - item.discountAmount,
              hsnCode: item.hsnCode,
              sacCode: item.sacCode,
              gstRate: item.gstRate || 0,
              serialNumber: index + 1
            }
          })
        )
      )
      
      // Create GST calculation records
      if (gstCalculations && gstCalculations.length > 0) {
        await Promise.all(
          gstCalculations.map((calc: any) =>
            tx.gSTCalculation.create({
              data: {
                transactionId: newTransaction.id,
                hsnCode: calc.hsnCode,
                sacCode: calc.sacCode,
                gstRate: calc.gstRate,
                taxableAmount: calc.taxableAmount,
                cgstAmount: calc.cgstAmount || 0,
                sgstAmount: calc.sgstAmount || 0,
                igstAmount: calc.igstAmount || 0,
                totalGstAmount: calc.totalGstAmount,
                gstType: calc.gstType
              }
            })
          )
        )
      }
      
      return {
        ...newTransaction,
        items: transactionItems,
        gstCalculations: gstCalculations
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating transaction:', error)
    
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
      { success: false, error: error instanceof Error ? error.message : 'Failed to create transaction' },
      { status: 500 }
    )
  }
} 