import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CentralDatabaseManager } from '@/lib/database/connection-manager';
import { TenantMigrationManager } from '@/lib/database/migration-manager';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.roles.includes('SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const centralDb = CentralDatabaseManager.getInstance();
    const migrationManager = new TenantMigrationManager('./backups', centralDb);

    // Get all tenants from central database
    const tenants = await centralDb.platformTenant.findMany({
      select: {
        id: true,
        companyName: true,
        slug: true,
        createdAt: true,
      },
    });

    const migrationStatus = await Promise.all(
      tenants.map(async (tenant: any) => {
        try {
          const statuses = await migrationManager.getMigrationStatus();
          const tenantStatus = statuses.find(s => s.tenantId === tenant.id);
          
          if (tenantStatus) {
            return {
              tenantId: tenant.id,
              organizationName: tenant.companyName,
              currentVersion: tenantStatus.currentVersion,
              pendingMigrations: tenantStatus.pendingMigrations,
              lastMigration: tenantStatus.lastMigration,
              status: tenantStatus.status,
              databaseStatus: tenantStatus.databaseStatus,
            };
          } else {
            return {
              tenantId: tenant.id,
              organizationName: tenant.companyName,
              currentVersion: 'unknown',
              pendingMigrations: [],
              lastMigration: undefined,
              status: 'failed' as const,
              databaseStatus: 'error' as const,
            };
          }
        } catch (error) {
          console.error(`Failed to get migration status for tenant ${tenant.id}:`, error);
          return {
            tenantId: tenant.id,
            organizationName: tenant.companyName,
            currentVersion: 'unknown',
            pendingMigrations: [],
            lastMigration: undefined,
            status: 'failed' as const,
            databaseStatus: 'error' as const,
          };
        }
      })
    );

    return NextResponse.json(migrationStatus);
  } catch (error) {
    console.error('Failed to get migration status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 