import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

interface MonthlyData {
  month: string;
  total: number;
  count: number;
}

/**
 * Calculate spending trends and forecasts
 * GET /api/transactions/trends?category=groceries&months=6
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // Optional: filter by category
    const subcategory = searchParams.get('subcategory'); // Optional: filter by subcategory
    const spendingType = searchParams.get('spendingType'); // Optional: filter by spending type
    const monthsBack = parseInt(searchParams.get('months') || '12'); // Default 12 months

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    // Build where clause
    const where: Record<string, unknown> = {
      userId: user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;
    if (spendingType) where.spendingType = spendingType;

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        date: true,
        amount: true,
        category: true,
        subcategory: true,
        spendingType: true,
        transactionType: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group by month
    const monthlyData: Record<string, MonthlyData> = {};

    for (const transaction of transactions) {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, total: 0, count: 0 };
      }

      // Only count debits (expenses) for trend analysis
      if (transaction.transactionType === 'debit') {
        monthlyData[monthKey].total += transaction.amount;
        monthlyData[monthKey].count += 1;
      }
    }

    // Convert to array and sort
    const monthlySummary = Object.values(monthlyData).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    // Calculate statistics
    const amounts = monthlySummary.map(m => m.total);
    const average = amounts.length > 0
      ? amounts.reduce((a, b) => a + b, 0) / amounts.length
      : 0;
    const min = amounts.length > 0 ? Math.min(...amounts) : 0;
    const max = amounts.length > 0 ? Math.max(...amounts) : 0;

    // Calculate trend (simple linear regression)
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (amounts.length >= 3) {
      const recent3 = amounts.slice(-3);
      const older3 = amounts.slice(0, Math.min(3, amounts.length - 3));
      const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
      const olderAvg = older3.length > 0
        ? older3.reduce((a, b) => a + b, 0) / older3.length
        : recentAvg;

      const change = ((recentAvg - olderAvg) / olderAvg) * 100;

      if (change > 10) trend = 'increasing';
      else if (change < -10) trend = 'decreasing';
    }

    // Simple forecast for next month (average of last 3 months)
    const last3Months = amounts.slice(-3);
    const forecast = last3Months.length > 0
      ? last3Months.reduce((a, b) => a + b, 0) / last3Months.length
      : average;

    // Calculate confidence based on variance
    const variance = amounts.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = average > 0 ? stdDev / average : 0;
    const confidence = Math.max(0, Math.min(100, (1 - coefficientOfVariation) * 100));

    // Get spending breakdown by type
    const fixedSpending = transactions
      .filter(t => t.spendingType === 'fixed' && t.transactionType === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const flexibleSpending = transactions
      .filter(t => t.spendingType === 'flexible' && t.transactionType === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const discretionarySpending = transactions
      .filter(t => t.spendingType === 'discretionary' && t.transactionType === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      success: true,
      trends: {
        monthlySummary,
        statistics: {
          average,
          min,
          max,
          trend,
          dataPoints: amounts.length,
        },
        forecast: {
          nextMonth: forecast,
          confidence,
        },
        spendingBreakdown: {
          fixed: fixedSpending,
          flexible: flexibleSpending,
          discretionary: discretionarySpending,
          total: fixedSpending + flexibleSpending + discretionarySpending,
        },
      },
    });
  } catch (error) {
    console.error('[Trends API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate trends' },
      { status: 500 }
    );
  }
}

/**
 * Update or create spending trend analysis
 * POST /api/transactions/trends
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category, subcategory } = await request.json();

    // Fetch GET trends first
    const trendsResponse = await GET(request);
    const trendsData = await trendsResponse.json();

    if (!trendsData.success) {
      return NextResponse.json({ error: 'Failed to calculate trends' }, { status: 500 });
    }

    const { statistics, forecast, spendingBreakdown } = trendsData.trends;
    const monthlySummary = trendsData.trends.monthlySummary as MonthlyData[];

    // Save to database
    const trend = await prisma.spendingTrend.upsert({
      where: {
        userId_category_subcategory: {
          userId: user.id,
          category: category || 'all',
          subcategory: subcategory || null,
        },
      },
      update: {
        monthlyAverage: statistics.average,
        monthlyMin: statistics.min,
        monthlyMax: statistics.max,
        last3Months: monthlySummary.slice(-3).map(m => m.total),
        last6Months: monthlySummary.slice(-6).map(m => m.total),
        nextMonthPrediction: forecast.nextMonth,
        confidenceLevel: forecast.confidence,
        trend: statistics.trend,
        dataPoints: statistics.dataPoints,
      },
      create: {
        userId: user.id,
        category: category || 'all',
        subcategory: subcategory || null,
        monthlyAverage: statistics.average,
        monthlyMin: statistics.min,
        monthlyMax: statistics.max,
        last3Months: monthlySummary.slice(-3).map(m => m.total),
        last6Months: monthlySummary.slice(-6).map(m => m.total),
        nextMonthPrediction: forecast.nextMonth,
        confidenceLevel: forecast.confidence,
        trend: statistics.trend,
        dataPoints: statistics.dataPoints,
      },
    });

    return NextResponse.json({
      success: true,
      trend,
      spendingBreakdown,
    });
  } catch (error) {
    console.error('[Trends POST API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save trends' },
      { status: 500 }
    );
  }
}
