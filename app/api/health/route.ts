import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();

    // Get table counts
    const profileCount = await prisma.profile.count();
    const sharedBudgetCount = await prisma.sharedBudget.count();
    const partnerRequestCount = await prisma.partnerRequest.count();
    const partnershipCount = await prisma.partnership.count();

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      tables: {
        profiles: profileCount,
        sharedBudgets: sharedBudgetCount,
        partnerRequests: partnerRequestCount,
        partnerships: partnershipCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
