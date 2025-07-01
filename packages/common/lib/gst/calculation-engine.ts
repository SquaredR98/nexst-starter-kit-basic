import { db } from '../database/connection-manager'

// GST calculation interfaces
export interface GSTCalculationInput {
  fromStateId: string
  toStateId?: string | null
  taxableAmount: number
  itemCategory?: string
  hsnCode?: string
  isExport?: boolean
  isImport?: boolean
}

export interface GSTCalculationResult {
  transactionType: 'INTRASTATE' | 'INTERSTATE' | 'EXPORT' | 'IMPORT'
  taxableAmount: number
  
  // Tax rates
  cgstRate: number
  sgstRate: number
  igstRate: number
  cessRate: number
  
  // Tax amounts
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  cessAmount: number
  totalTaxAmount: number
  totalAmount: number
  
  // GST details
  applicableGSTRate: number
  gstCategory: string
  hsnCode?: string
}

export interface GSTRateData {
  cgstRate: number
  sgstRate: number
  igstRate: number
  cessRate: number
  category: string
  hsnCode?: string
}

export interface InterstateTransactionData {
  fromBranchId: string
  toBranchId: string
  fromStateCode: string
  toStateCode: string
  isWithinOrganization: boolean
}

/**
 * GST Calculation Engine for Indian GST compliance
 */
export class GSTCalculationEngine {
  
  /**
   * Main GST calculation method
   */
  static async calculateGST(
    tenantId: string,
    input: GSTCalculationInput
  ): Promise<GSTCalculationResult> {
    
    try {
      const transactionType = this.determineTransactionType(input)
      const gstRates = await this.getGSTRates(tenantId, input)
      
      switch (transactionType) {
        case 'INTRASTATE':
          return this.calculateIntrastateGST(input, gstRates)
        case 'INTERSTATE':
          return this.calculateInterstateGST(input, gstRates)
        case 'EXPORT':
          return this.calculateExportGST(input, gstRates)
        case 'IMPORT':
          return this.calculateImportGST(input, gstRates)
        default:
          throw new Error(`Unknown transaction type: ${transactionType}`)
      }
      
    } catch (error) {
      console.error('GST calculation error:', error)
      throw error
    }
  }
  
  /**
   * Determine transaction type
   */
  private static determineTransactionType(input: GSTCalculationInput): 'INTRASTATE' | 'INTERSTATE' | 'EXPORT' | 'IMPORT' {
    if (input.isExport) return 'EXPORT'
    if (input.isImport) return 'IMPORT'
    
    if (!input.toStateId || input.fromStateId === input.toStateId) {
      return 'INTRASTATE'
    }
    
    return 'INTERSTATE'
  }
  
  /**
   * Get GST rates from central database
   */
  private static async getGSTRates(
    tenantId: string,
    input: GSTCalculationInput
  ): Promise<GSTRateData> {
    
    const central = db.central()
    
    // Try to find by HSN code first
    let gstRate = null
    
    if (input.hsnCode) {
      gstRate = await central.gSTRate.findFirst({
        where: {
          hsn: input.hsnCode,
          isActive: true,
          effectiveFrom: { lte: new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } }
          ]
        }
      })
    }
    
    // Fallback to category-based rates
    if (!gstRate && input.itemCategory) {
      gstRate = await central.gSTRate.findFirst({
        where: {
          category: input.itemCategory,
          isActive: true,
          effectiveFrom: { lte: new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } }
          ]
        }
      })
    }
    
    // Default rates if nothing found
    if (!gstRate) {
      return {
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
        cessRate: 0,
        category: input.itemCategory || 'goods',
        hsnCode: input.hsnCode
      }
    }
    
    return {
      cgstRate: gstRate.cgstRate,
      sgstRate: gstRate.sgstRate,
      igstRate: gstRate.igstRate,
      cessRate: gstRate.cessRate,
      category: gstRate.category,
      hsnCode: gstRate.hsn || input.hsnCode
    }
  }
  
  /**
   * Calculate intrastate GST (CGST + SGST)
   */
  private static calculateIntrastateGST(
    input: GSTCalculationInput,
    rates: GSTRateData
  ): GSTCalculationResult {
    
    const cgstAmount = (input.taxableAmount * rates.cgstRate) / 100
    const sgstAmount = (input.taxableAmount * rates.sgstRate) / 100
    const cessAmount = (input.taxableAmount * rates.cessRate) / 100
    const totalTaxAmount = cgstAmount + sgstAmount + cessAmount
    
    return {
      transactionType: 'INTRASTATE',
      taxableAmount: input.taxableAmount,
      cgstRate: rates.cgstRate,
      sgstRate: rates.sgstRate,
      igstRate: 0,
      cessRate: rates.cessRate,
      cgstAmount: this.roundToTwo(cgstAmount),
      sgstAmount: this.roundToTwo(sgstAmount),
      igstAmount: 0,
      cessAmount: this.roundToTwo(cessAmount),
      totalTaxAmount: this.roundToTwo(totalTaxAmount),
      totalAmount: this.roundToTwo(input.taxableAmount + totalTaxAmount),
      applicableGSTRate: rates.cgstRate + rates.sgstRate,
      gstCategory: rates.category,
      hsnCode: rates.hsnCode
    }
  }
  
  /**
   * Calculate interstate GST (IGST)
   */
  private static calculateInterstateGST(
    input: GSTCalculationInput,
    rates: GSTRateData
  ): GSTCalculationResult {
    
    const igstAmount = (input.taxableAmount * rates.igstRate) / 100
    const cessAmount = (input.taxableAmount * rates.cessRate) / 100
    const totalTaxAmount = igstAmount + cessAmount
    
    return {
      transactionType: 'INTERSTATE',
      taxableAmount: input.taxableAmount,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: rates.igstRate,
      cessRate: rates.cessRate,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: this.roundToTwo(igstAmount),
      cessAmount: this.roundToTwo(cessAmount),
      totalTaxAmount: this.roundToTwo(totalTaxAmount),
      totalAmount: this.roundToTwo(input.taxableAmount + totalTaxAmount),
      applicableGSTRate: rates.igstRate,
      gstCategory: rates.category,
      hsnCode: rates.hsnCode
    }
  }
  
  /**
   * Calculate export GST (zero-rated)
   */
  private static calculateExportGST(
    input: GSTCalculationInput,
    rates: GSTRateData
  ): GSTCalculationResult {
    
    return {
      transactionType: 'EXPORT',
      taxableAmount: input.taxableAmount,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      cessRate: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      cessAmount: 0,
      totalTaxAmount: 0,
      totalAmount: input.taxableAmount,
      applicableGSTRate: 0,
      gstCategory: rates.category,
      hsnCode: rates.hsnCode
    }
  }
  
  /**
   * Calculate import GST
   */
  private static calculateImportGST(
    input: GSTCalculationInput,
    rates: GSTRateData
  ): GSTCalculationResult {
    
    const igstAmount = (input.taxableAmount * rates.igstRate) / 100
    const cessAmount = (input.taxableAmount * rates.cessRate) / 100
    const totalTaxAmount = igstAmount + cessAmount
    
    return {
      transactionType: 'IMPORT',
      taxableAmount: input.taxableAmount,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: rates.igstRate,
      cessRate: rates.cessRate,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: this.roundToTwo(igstAmount),
      cessAmount: this.roundToTwo(cessAmount),
      totalTaxAmount: this.roundToTwo(totalTaxAmount),
      totalAmount: this.roundToTwo(input.taxableAmount + totalTaxAmount),
      applicableGSTRate: rates.igstRate,
      gstCategory: rates.category,
      hsnCode: rates.hsnCode
    }
  }
  
  /**
   * Validate interstate transaction
   */
  static async validateInterstateTransaction(
    tenantId: string,
    fromBranchId: string,
    toBranchId: string
  ): Promise<{
    fromBranchId: string
    toBranchId: string
    fromStateCode: string
    toStateCode: string
    isValid: boolean
  }> {
    
    const tenantDb = await db.tenant(tenantId)
    
    const fromBranch = await tenantDb.stateBranch.findUnique({
      where: { id: fromBranchId }
    })
    
    const toBranch = await tenantDb.stateBranch.findUnique({
      where: { id: toBranchId }
    })
    
    if (!fromBranch || !toBranch) {
      throw new Error('Invalid state branch IDs')
    }
    
    if (fromBranch.organizationId !== toBranch.organizationId) {
      throw new Error('Interstate transactions only allowed within same organization')
    }
    
    return {
      fromBranchId,
      toBranchId,
      fromStateCode: fromBranch.stateCode,
      toStateCode: toBranch.stateCode,
      isValid: true
    }
  }
  
  /**
   * Get GST summary for multiple transactions
   */
  static summarizeGSTCalculations(calculations: GSTCalculationResult[]): {
    totalTaxableAmount: number
    totalCGST: number
    totalSGST: number
    totalIGST: number
    totalCESS: number
    totalTax: number
    totalAmount: number
    transactionBreakdown: { [key: string]: number }
  } {
    
    const summary = calculations.reduce(
      (acc, calc) => ({
        totalTaxableAmount: acc.totalTaxableAmount + calc.taxableAmount,
        totalCGST: acc.totalCGST + calc.cgstAmount,
        totalSGST: acc.totalSGST + calc.sgstAmount,
        totalIGST: acc.totalIGST + calc.igstAmount,
        totalCESS: acc.totalCESS + calc.cessAmount,
        totalTax: acc.totalTax + calc.totalTaxAmount,
        totalAmount: acc.totalAmount + calc.totalAmount,
        transactionBreakdown: {
          ...acc.transactionBreakdown,
          [calc.transactionType]: (acc.transactionBreakdown[calc.transactionType] || 0) + 1
        }
      }),
      {
        totalTaxableAmount: 0,
        totalCGST: 0,
        totalSGST: 0,
        totalIGST: 0,
        totalCESS: 0,
        totalTax: 0,
        totalAmount: 0,
        transactionBreakdown: {} as { [key: string]: number }
      }
    )
    
    // Round all amounts
    return {
      totalTaxableAmount: this.roundToTwo(summary.totalTaxableAmount),
      totalCGST: this.roundToTwo(summary.totalCGST),
      totalSGST: this.roundToTwo(summary.totalSGST),
      totalIGST: this.roundToTwo(summary.totalIGST),
      totalCESS: this.roundToTwo(summary.totalCESS),
      totalTax: this.roundToTwo(summary.totalTax),
      totalAmount: this.roundToTwo(summary.totalAmount),
      transactionBreakdown: summary.transactionBreakdown
    }
  }

  /**
   * Round to 2 decimal places
   */
  private static roundToTwo(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100
  }
}

/**
 * Interstate Transaction Manager
 * Handles complex interstate transaction scenarios
 */
export class InterstateTransactionManager {
  
  /**
   * Create interstate transaction with proper GST calculation
   */
  static async createInterstateTransaction(
    tenantId: string,
    fromBranchId: string,
    toBranchId: string,
    transactionData: {
      customerId?: string
      supplierId?: string
      items: Array<{
        productId: string
        quantity: number
        unitPrice: number
        hsnCode?: string
        category?: string
      }>
      transactionType: string
    }
  ): Promise<{
    id: string
    organizationId: string
    fromStateBranchId: string
    toStateBranchId: string | null
    transactionNumber: string
    transactionType: string
    totalAmount: number
    items: Array<{
      id: string
      productId: string
      quantity: number
      unitPrice: number
      lineTotal: number
      taxAmount: number
    }>
  }> {
    
    try {
      // Validate interstate transaction
      await GSTCalculationEngine.validateInterstateTransaction(
        tenantId,
        fromBranchId,
        toBranchId
      )
      
      const tenantDb = await db.tenant(tenantId)
      
      // Calculate GST for each item
      const itemCalculations = await Promise.all(
        transactionData.items.map(async (item) => {
          const gstResult = await GSTCalculationEngine.calculateGST(tenantId, {
            fromStateId: fromBranchId,
            toStateId: toBranchId,
            taxableAmount: item.quantity * item.unitPrice,
            itemCategory: item.category,
            hsnCode: item.hsnCode
          })
          
          return {
            ...item,
            gstCalculation: gstResult
          }
        })
      )
      
      // Calculate transaction totals
      const totals = GSTCalculationEngine.summarizeGSTCalculations(
        itemCalculations.map(item => item.gstCalculation)
      )
      
      // Create transaction record
      const transaction = await tenantDb.transaction.create({
        data: {
          organizationId: (await tenantDb.stateBranch.findUnique({
            where: { id: fromBranchId }
          }))!.organizationId,
          fromStateBranchId: fromBranchId,
          toStateBranchId: toBranchId,
          transactionNumber: await this.generateTransactionNumber(tenantDb),
          transactionType: transactionData.transactionType as 'SALE_INVOICE' | 'PURCHASE_INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'QUOTATION' | 'PURCHASE_ORDER' | 'DELIVERY_NOTE' | 'RECEIPT_NOTE' | 'RETURN_SALE' | 'RETURN_PURCHASE',
          transactionDate: new Date(),
          customerId: transactionData.customerId,
          supplierId: transactionData.supplierId,
          subtotal: totals.totalTaxableAmount,
          taxableAmount: totals.totalTaxableAmount,
          cgstAmount: totals.totalCGST,
          sgstAmount: totals.totalSGST,
          igstAmount: totals.totalIGST,
          cessAmount: totals.totalCESS,
          totalTaxAmount: totals.totalTax,
          totalAmount: totals.totalAmount,
          status: 'DRAFT',
          createdBy: 'system', // This should come from context
          items: {
            create: itemCalculations.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.quantity * item.unitPrice,
              hsnCode: item.hsnCode,
              gstRate: item.gstCalculation.applicableGSTRate,
              cgstRate: item.gstCalculation.cgstRate,
              sgstRate: item.gstCalculation.sgstRate,
              igstRate: item.gstCalculation.igstRate,
              taxAmount: item.gstCalculation.totalTaxAmount
            }))
          }
        },
        include: {
          items: true
        }
      })
      
      return transaction
      
    } catch (error) {
      console.error('Interstate transaction creation error:', error)
      throw error
    }
  }
  
  /**
   * Generate unique transaction number
   */
  private static async generateTransactionNumber(tenantDb: Awaited<ReturnType<typeof db.tenant>>): Promise<string> {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    
    const count = await tenantDb.transaction.count({
      where: {
        createdAt: {
          gte: new Date(year, new Date().getMonth(), 1),
          lt: new Date(year, new Date().getMonth() + 1, 1)
        }
      }
    })
    
    return `TXN-${year}${month}-${String(count + 1).padStart(4, '0')}`
  }
} 