/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { TenantDatabaseManager } from '@/lib/database/connection-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/tenant/gst/returns
 * List GST returns with filtering
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
    const stateCode = searchParams.get('stateCode') || ''
    const returnType = searchParams.get('returnType') || ''
    const status = searchParams.get('status') || ''
    
    const skip = (page - 1) * limit
    
    // Get tenant database connection
    const tenantDb = await TenantDatabaseManager.getConnection(session.user.tenantId)
    
    // Build filters with state access control
    const where: Record<string, any> = {
      organizationId: session.user.organizationId
    }
    
    // Apply state-based filtering for state-restricted users
    if (session.user.isStateRestricted) {
      where.stateBranch = {
        stateCode: {
          in: session.user.accessibleStates
        }
      }
    }
    
    // Apply filters
    if (stateCode) {
      where.stateBranch = { ...where.stateBranch, stateCode }
    }
    
    if (returnType) {
      where.returnType = returnType
    }
    
    if (status) {
      where.status = status
    }
    
    const [gstReturns, total] = await Promise.all([
      tenantDb.gSTReturn.findMany({
        where,
        include: {
          stateBranch: {
            select: {
              id: true,
              stateName: true,
              stateCode: true,
              branchName: true,
              gstNumber: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      tenantDb.gSTReturn.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        gstReturns,
        pagination: {
          page,
          limit, 
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching GST returns:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch GST returns' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tenant/gst/returns
 * Generate GST return data from transactions
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
    const { stateBranchId, returnType, fromDate, toDate } = body
    
    // Get tenant database connection
    const tenantDb = await TenantDatabaseManager.getConnection(session.user.tenantId)
    
    // Validate state branch access
    const stateBranch = await tenantDb.stateBranch.findUnique({
      where: { 
        id: stateBranchId,
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
    
    // Generate return data based on type
    let returnData: Record<string, any> = {}
    
    if (returnType === 'GSTR1') {
      // Get sales transactions
      const salesTransactions = await tenantDb.transaction.findMany({
        where: {
          organizationId: session.user.organizationId,
          stateBranchId,
          transactionType: 'SALE',
          transactionDate: {
            gte: new Date(fromDate),
            lte: new Date(toDate)
          }
        },
        include: {
          customer: true,
          gstCalculations: true
        }
      })
      
      const totalTaxableValue = salesTransactions.reduce((sum: number, t: any) => sum + (t.subtotal || 0), 0)
      const totalTaxAmount = salesTransactions.reduce((sum: number, t: any) => sum + (t.totalGST || 0), 0)
      
      returnData = {
        returnType: 'GSTR1',
        period: `${new Date(fromDate).toISOString().slice(0, 7)}`,
        totalTransactions: salesTransactions.length,
        totalTaxableValue,
        totalTaxAmount,
        transactions: salesTransactions.map((t: any) => ({
          invoiceNumber: t.transactionNumber,
          invoiceDate: t.transactionDate,
          customerName: t.customer?.name,
          customerGSTIN: t.customer?.gstNumber,
          taxableValue: t.subtotal,
          totalTax: t.totalGST,
          totalAmount: t.grandTotal
        }))
      }
    } else if (returnType === 'GSTR3B') {
      // Get summary for the period
      const [salesTotal, purchasesTotal] = await Promise.all([
        tenantDb.transaction.aggregate({
          where: {
            organizationId: session.user.organizationId,
            stateBranchId,
            transactionType: 'SALE',
            transactionDate: {
              gte: new Date(fromDate),
              lte: new Date(toDate)
            }
          },
          _sum: {
            subtotal: true,
            totalGST: true
          }
        }),
        tenantDb.transaction.aggregate({
          where: {
            organizationId: session.user.organizationId,
            stateBranchId,
            transactionType: 'PURCHASE',
            transactionDate: {
              gte: new Date(fromDate),
              lte: new Date(toDate)
            }
          },
          _sum: {
            subtotal: true,
            totalGST: true
          }
        })
      ])
      
      returnData = {
        returnType: 'GSTR3B',
        period: `${new Date(fromDate).toISOString().slice(0, 7)}`,
        outwardSupplies: {
          taxableValue: salesTotal._sum.subtotal || 0,
          totalTax: salesTotal._sum.totalGST || 0
        },
        inputTaxCredit: {
          taxableValue: purchasesTotal._sum.subtotal || 0,
          totalInputTax: purchasesTotal._sum.totalGST || 0
        },
        netTaxLiability: Math.max(0, (salesTotal._sum.totalGST || 0) - (purchasesTotal._sum.totalGST || 0))
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `${returnType} data generated successfully`,
      data: returnData
    })
    
  } catch (error) {
    console.error('Error generating GST return:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate GST return data' },
      { status: 500 }
    )
  }
} 