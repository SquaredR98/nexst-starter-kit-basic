import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CentralDatabaseManager } from '@/lib/database/connection-manager';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.roles.includes('SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const centralDb = CentralDatabaseManager.getInstance();
    const totalTenants = await centralDb.platformTenant.count();
    const activeTenants = await centralDb.platformTenant.count({ where: { isActive: true } });
    // TODO: Calculate total revenue, active users, storage used, storage limit
    const totalRevenue = 0;
    const activeUsers = 0;
    const storageUsed = 0;
    const storageLimit = 100 * 1024; // 100 GB (example)
    const systemHealth = 'healthy';

    return NextResponse.json({
      totalTenants,
      activeTenants,
      totalRevenue,
      systemHealth,
      activeUsers,
      storageUsed,
      storageLimit,
    });
  } catch (error) {
    console.error('Failed to fetch system stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 