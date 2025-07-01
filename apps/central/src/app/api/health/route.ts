// ============================================================================
// HEALTH CHECK API - Deployment Monitoring
// ============================================================================

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { licenseManager } from '@/lib/license';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  deploymentType: string;
  checks: {
    database: boolean;
    license?: boolean;
    redis?: boolean;
  };
  license?: {
    valid: boolean;
    expiresInDays?: number;
    features?: string[];
  };
  uptime: number;
}

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    const checks = {
      database: false,
      license: undefined as boolean | undefined,
      redis: undefined as boolean | undefined
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
      checks.database = false;
    }

    // Check license for on-premise deployments
    let licenseInfo = undefined;
    if (process.env.DEPLOYMENT_TYPE === 'onpremise') {
      try {
        const validation = await licenseManager.validateLicense();
        checks.license = validation.isValid;
        
        if (validation.license) {
          licenseInfo = {
            valid: validation.isValid,
            expiresInDays: validation.expiresInDays,
            features: validation.license.features
          };
        }
      } catch (error) {
        console.error('License health check failed:', error);
        checks.license = false;
      }
    }

    // Check Redis connection (optional)
    if (process.env.REDIS_URL) {
      try {
        // TODO: Implement Redis health check
        checks.redis = true;
      } catch (error) {
        console.error('Redis health check failed:', error);
        checks.redis = false;
      }
    }

    // Determine overall health status
    const isHealthy = checks.database && 
                     (process.env.DEPLOYMENT_TYPE !== 'onpremise' || checks.license !== false);

    const healthResult: HealthCheckResult = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      deploymentType: process.env.DEPLOYMENT_TYPE || 'unknown',
      checks,
      uptime: process.uptime(),
      ...(licenseInfo && { license: licenseInfo })
    };

    const statusCode = isHealthy ? 200 : 503;
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      ...healthResult,
      responseTime: `${responseTime}ms`
    }, { status: statusCode });

  } catch (error) {
    console.error('Health check error:', error);
    
    const errorResult: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      deploymentType: process.env.DEPLOYMENT_TYPE || 'unknown',
      checks: {
        database: false,
        license: false,
        redis: false
      },
      uptime: process.uptime()
    };

    return NextResponse.json({
      ...errorResult,
      error: 'Health check failed',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 503 });
  }
}

/**
 * HEAD /api/health
 * Simple health check for monitoring tools
 */
export async function HEAD() {
  try {
    // Quick database ping
    await prisma.$queryRaw`SELECT 1`;
    
    // Quick license check for on-premise
    if (process.env.DEPLOYMENT_TYPE === 'onpremise') {
      const validation = await licenseManager.validateLicense();
      if (!validation.isValid) {
        return new Response(null, { status: 503 });
      }
    }

    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
} 