import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CentralDatabaseManager } from '@/lib/database/connection-manager';
import { TenantMigrationManager } from '@/lib/database/migration-manager';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.roles.includes('SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantIds } = await request.json();

    if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid tenant IDs provided' },
        { status: 400 }
      );
    }

    const centralDb = CentralDatabaseManager.getInstance();
    const migrationManager = new TenantMigrationManager('./backups', centralDb);

    // Get tenant details
    const tenants = await centralDb.platformTenant.findMany({
      where: { id: { in: tenantIds } },
      select: {
        id: true,
        companyName: true,
        slug: true,
        databaseConfig: true,
      },
    });

    // Run migrations for each tenant
    const results = await Promise.all(
      tenants.map(async (tenant) => {
        try {
          // Extract database configuration
          const dbConfig = tenant.databaseConfig as any;
          const databaseUrl = dbConfig?.url || process.env.TENANT_DATABASE_URL?.replace('tenant_db', tenant.slug);

          if (!databaseUrl) {
            throw new Error('Database URL not configured');
          }

          const config = {
            tenantId: tenant.id,
            databaseUrl,
            schemaPath: './prisma/schemas/tenant.prisma',
            backupDir: './backups',
            migrationType: 'update' as const,
          };

          const result = await migrationManager.updateTenantDatabase(config);
          return result;
        } catch (error) {
          console.error(`Migration failed for tenant ${tenant.id}:`, error);
          return {
            success: false,
            tenantId: tenant.id,
            migrationId: `failed_${Date.now()}`,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: 0,
            timestamp: new Date(),
          };
        }
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Bulk migration failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 