import { PrismaClient as CentralPrismaClient } from '../../node_modules/.prisma/central'
import { PrismaClient as TenantPrismaClient } from '../../node_modules/.prisma/tenant'
import crypto from 'crypto'

// Database connection interfaces
interface TenantDbCredentials {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
}

interface TenantConnectionInfo {
  tenantId: string
  credentials: TenantDbCredentials
  lastConnectedAt: Date
  status: 'CONNECTED' | 'FAILED' | 'CONNECTING'
}

// Connection pools for tenant databases
const tenantConnections = new Map<string, TenantPrismaClient>()
const connectionInfo = new Map<string, TenantConnectionInfo>()

// Central database client (singleton)

// Encryption key for tenant credentials
const ENCRYPTION_KEY = process.env.TENANT_ENCRYPTION_KEY || 'your-32-character-secret-key-here'

/**
 * Central Database Connection Manager
 */
export class CentralDatabaseManager {
  private static instance: CentralPrismaClient

  static getInstance(): CentralPrismaClient {
    if (!this.instance) {
      this.instance = new CentralPrismaClient({
        datasources: {
          db: {
            url: process.env.CENTRAL_DATABASE_URL
          }
        }
      })
    }
    return this.instance
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect()
      this.instance = null as any
    }
  }
}

/**
 * Tenant Database Connection Manager
 */
export class TenantDatabaseManager {
  
  /**
   * Get or create tenant database connection
   */
  static async getConnection(tenantId: string): Promise<TenantPrismaClient> {
    // Check if connection already exists and is healthy
    if (tenantConnections.has(tenantId)) {
      const client = tenantConnections.get(tenantId)!
      
      try {
        // Test connection health
        await client.$queryRaw`SELECT 1`
        return client
      } catch (error) {
        // Connection failed, remove and recreate
        console.warn(`Tenant ${tenantId} connection failed, recreating...`)
        await this.removeConnection(tenantId)
      }
    }

    // Create new connection
    return await this.createConnection(tenantId)
  }

  /**
   * Create new tenant database connection
   */
  private static async createConnection(tenantId: string): Promise<TenantPrismaClient> {
    try {
      // Get tenant credentials from central database
      const central = CentralDatabaseManager.getInstance()
      const tenant = await central.platformTenant.findUnique({
        where: { id: tenantId }
      })

      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`)
      }

      if (!tenant.databaseConfig) {
        throw new Error(`Tenant ${tenantId} has no database configuration`)
      }

      // Decrypt credentials
      const credentials = this.decryptCredentials(tenant.databaseConfig as any)
      
      // Build connection URL
      const connectionUrl = this.buildConnectionUrl(credentials)
      
      // Create Prisma client
      const client = new TenantPrismaClient({
        datasources: {
          db: {
            url: connectionUrl
          }
        }
      })

      // Test connection
      await client.$connect()
      await client.$queryRaw`SELECT 1`

      // Store connection
      tenantConnections.set(tenantId, client)
      connectionInfo.set(tenantId, {
        tenantId,
        credentials,
        lastConnectedAt: new Date(),
        status: 'CONNECTED'
      })

      // Update central database status
      await central.platformTenant.update({
        where: { id: tenantId },
        data: {
          databaseStatus: 'CONNECTED',
          lastConnectedAt: new Date()
        }
      })

      console.log(`Successfully connected to tenant ${tenantId} database`)
      return client

    } catch (error) {
      console.error(`Failed to connect to tenant ${tenantId} database:`, error)
      
      // Update central database status
      const central = CentralDatabaseManager.getInstance()
      await central.platformTenant.update({
        where: { id: tenantId },
        data: {
          databaseStatus: 'FAILED'
        }
      }).catch(() => {}) // Ignore errors in error handling

      throw error
    }
  }

  /**
   * Remove tenant connection
   */
  static async removeConnection(tenantId: string): Promise<void> {
    const client = tenantConnections.get(tenantId)
    if (client) {
      await client.$disconnect()
      tenantConnections.delete(tenantId)
      connectionInfo.delete(tenantId)
    }
  }

  /**
   * Validate tenant database connection
   */
  static async validateConnection(credentials: TenantDbCredentials): Promise<boolean> {
    try {
      const connectionUrl = this.buildConnectionUrl(credentials)
      const testClient = new TenantPrismaClient({
        datasources: {
          db: { url: connectionUrl }
        }
      })

      await testClient.$connect()
      await testClient.$queryRaw`SELECT 1`
      await testClient.$disconnect()

      return true
    } catch (error) {
      console.error('Database validation failed:', error)
      return false
    }
  }

  /**
   * Create tenant database schema
   */
  static async createTenantSchema(tenantId: string): Promise<void> {
    try {
      const client = await this.getConnection(tenantId)
      
      // Run Prisma migrations for tenant schema
      // This would typically be done via Prisma CLI in deployment
      console.log(`Creating schema for tenant ${tenantId}`)
      
      // For now, we'll assume the schema exists
      // In production, you'd run: npx prisma db push --schema=prisma/schemas/tenant.prisma
      
    } catch (error) {
      console.error(`Failed to create schema for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Get all active tenant connections
   */
  static getActiveConnections(): string[] {
    return Array.from(tenantConnections.keys())
  }

  /**
   * Get connection info for tenant
   */
  static getConnectionInfo(tenantId: string): TenantConnectionInfo | undefined {
    return connectionInfo.get(tenantId)
  }

  /**
   * Disconnect all tenant connections
   */
  static async disconnectAll(): Promise<void> {
    const promises = Array.from(tenantConnections.entries()).map(async ([tenantId, client]) => {
      try {
        await client.$disconnect()
      } catch (error) {
        console.error(`Error disconnecting tenant ${tenantId}:`, error)
      }
    })

    await Promise.all(promises)
    tenantConnections.clear()
    connectionInfo.clear()
  }

  /**
   * Health check for all connections
   */
  static async healthCheck(): Promise<{ [tenantId: string]: boolean }> {
    const results: { [tenantId: string]: boolean } = {}

    for (const [tenantId, client] of tenantConnections.entries()) {
      try {
        await client.$queryRaw`SELECT 1`
        results[tenantId] = true
      } catch (error) {
        results[tenantId] = false
        console.error(`Health check failed for tenant ${tenantId}:`, error)
      }
    }

    return results
  }

  /**
   * Build database connection URL
   */
  private static buildConnectionUrl(credentials: TenantDbCredentials): string {
    const { host, port, database, username, password, ssl } = credentials
    const sslMode = ssl ? '?sslmode=require' : ''
    return `postgresql://${username}:${password}@${host}:${port}/${database}${sslMode}`
  }

  /**
   * Encrypt tenant database credentials
   */
  static encryptCredentials(credentials: TenantDbCredentials): string {
    const text = JSON.stringify(credentials)
    const algorithm = 'aes-256-gcm'
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(algorithm, ENCRYPTION_KEY)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encrypted
    })
  }

  /**
   * Decrypt tenant database credentials
   */
  private static decryptCredentials(encryptedData: any): TenantDbCredentials {
    try {
      const { iv, authTag, encrypted } = typeof encryptedData === 'string' 
        ? JSON.parse(encryptedData) 
        : encryptedData

      const algorithm = 'aes-256-gcm'
      const decipher = crypto.createDecipher(algorithm, ENCRYPTION_KEY)
      decipher.setAuthTag(Buffer.from(authTag, 'hex'))
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Failed to decrypt tenant credentials:', error)
      throw new Error('Invalid encrypted credentials')
    }
  }
}

/**
 * Database connection utility functions
 */
export const db = {
  central: () => CentralDatabaseManager.getInstance(),
  tenant: (tenantId: string) => TenantDatabaseManager.getConnection(tenantId)
}

/**
 * Cleanup connections on process exit
 */
process.on('SIGINT', async () => {
  console.log('Shutting down database connections...')
  await Promise.all([
    CentralDatabaseManager.disconnect(),
    TenantDatabaseManager.disconnectAll()
  ])
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Shutting down database connections...')
  await Promise.all([
    CentralDatabaseManager.disconnect(),
    TenantDatabaseManager.disconnectAll()
  ])
  process.exit(0)
})

export type { TenantDbCredentials, TenantConnectionInfo } 