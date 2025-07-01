/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// SUBSCRIPTION MANAGEMENT API - SaaS Features
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { licenseManager } from '@/lib/license';
import { z } from 'zod';

// Validation schemas
const subscriptionUpdateSchema = z.object({
  planId: z.string().optional(),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']).optional(),
  autoRenew: z.boolean().optional()
});

const usageRecordSchema = z.object({
  metricName: z.string(),
  usageValue: z.number(),
  periodStart: z.string().transform(str => new Date(str)),
  periodEnd: z.string().transform(str => new Date(str))
});

/**
 * GET /api/subscription
 * Get current organization's subscription details
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has admin permissions
    const hasAdminAccess = session.user.roles?.some((role: any) => 
      typeof role === 'string' ? 
      ['organization_admin', 'super_admin'].includes(role) :
      ['organization_admin', 'super_admin'].includes(role.code)
    );

    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // For on-premise deployments, return license info
    if (process.env.DEPLOYMENT_TYPE === 'onpremise') {
      const licenseInfo = await licenseManager.getLicenseInfo();
      
      if (!licenseInfo) {
        return NextResponse.json(
          { error: 'License not found or invalid' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        type: 'license',
        license: {
          organizationName: licenseInfo.organizationName,
          licensedUsers: licenseInfo.licensedUsers,
          features: licenseInfo.features,
          expiryDate: licenseInfo.expiryDate,
          deploymentType: licenseInfo.deploymentType,
          version: licenseInfo.version
        }
      });
    }

    // For cloud deployments, return subscription info
    const subscription = await prisma.organizationSubscription.findUnique({
      where: { organizationId: session.user.organizationId },
      include: {
        plan: true,
        usage: {
          orderBy: { recordedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!subscription) {
      return NextResponse.json({
        type: 'subscription',
        subscription: null,
        hasActiveSubscription: false
      });
    }

    // Calculate current usage
    const currentUsage = await calculateCurrentUsage(session.user.organizationId);

    return NextResponse.json({
      type: 'subscription',
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        autoRenew: subscription.autoRenew,
        usage: currentUsage,
        recentUsage: subscription.usage
      },
      hasActiveSubscription: subscription.status === 'ACTIVE'
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/subscription
 * Update subscription settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has admin permissions
    const hasAdminAccess = session.user.roles?.some((role: any) => 
      typeof role === 'string' ? 
      ['organization_admin', 'super_admin'].includes(role) :
      ['organization_admin', 'super_admin'].includes(role.code)
    );

    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // On-premise deployments cannot update subscriptions
    if (process.env.DEPLOYMENT_TYPE === 'onpremise') {
      return NextResponse.json(
        { error: 'Subscription updates not available for on-premise deployments' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = subscriptionUpdateSchema.parse(body);

    // Update subscription
    const updatedSubscription = await prisma.organizationSubscription.update({
      where: { organizationId: session.user.organizationId },
      data: validatedData,
      include: { plan: true }
    });

    return NextResponse.json({
      subscription: updatedSubscription,
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscription/usage
 * Record usage metrics
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get subscription
    const subscription = await prisma.organizationSubscription.findUnique({
      where: { organizationId: session.user.organizationId }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = usageRecordSchema.parse(body);

    // Record usage
    const usageRecord = await prisma.subscriptionUsage.create({
      data: {
        subscriptionId: subscription.id,
        ...validatedData
      }
    });

    // Check if usage exceeds limits
    const limits = await checkUsageLimits(session.user.organizationId, validatedData.metricName);

    return NextResponse.json({
      usage: usageRecord,
      limits,
      message: 'Usage recorded successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Record usage error:', error);
    return NextResponse.json(
      { error: 'Failed to record usage' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to calculate current usage
 */
async function calculateCurrentUsage(organizationId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Calculate user count
  const userCount = await prisma.user.count({
    where: { organizationId, isActive: true }
  });

  // Calculate storage usage (mock - implement based on your storage system)
  const storageUsage = 0; // TODO: Implement actual storage calculation

  // Calculate API calls (from audit logs)
  const apiCalls = await prisma.auditLog.count({
    where: {
      organizationId,
      timestamp: { gte: startOfMonth }
    }
  });

  return {
    users: userCount,
    storage: storageUsage,
    apiCalls,
    period: {
      start: startOfMonth,
      end: now
    }
  };
}

/**
 * Helper function to check usage limits
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function checkUsageLimits(organizationId: string, _metricName: string) {
  const subscription = await prisma.organizationSubscription.findUnique({
    where: { organizationId },
    include: { plan: true }
  });

  if (!subscription) {
    return { withinLimits: false, error: 'No subscription found' };
  }

  const currentUsage = await calculateCurrentUsage(organizationId);
  const plan = subscription.plan;

  const limits = {
    users: {
      current: currentUsage.users,
      limit: plan.maxUsers || Infinity,
      withinLimit: plan.maxUsers ? currentUsage.users <= plan.maxUsers : true
    },
    storage: {
      current: currentUsage.storage,
      limit: plan.maxStorageGb || Infinity,
      withinLimit: plan.maxStorageGb ? currentUsage.storage <= (plan.maxStorageGb * 1024 * 1024 * 1024) : true
    }
  };

  const allWithinLimits = Object.values(limits).every(limit => limit.withinLimit);

  return {
    withinLimits: allWithinLimits,
    limits,
    subscription: {
      plan: plan.name,
      status: subscription.status
    }
  };
} 