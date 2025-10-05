import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

/**
 * Get user's transactions with filters
 * GET /api/transactions?month=january&year=2025&category=expense
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // "january"
    const year = searchParams.get('year'); // "2025"
    const category = searchParams.get('category');
    const onlyUnreviewed = searchParams.get('unreviewed') === 'true';

    // Build date filter
    let dateFilter: any = {};
    if (month && year) {
      const monthIndex = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ].indexOf(month.toLowerCase());

      if (monthIndex !== -1) {
        const startDate = new Date(parseInt(year), monthIndex, 1);
        const endDate = new Date(parseInt(year), monthIndex + 1, 0, 23, 59, 59);
        dateFilter = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        ...(category && { category }),
        ...(onlyUnreviewed && { isReviewed: false }),
      },
      orderBy: { date: 'desc' },
      take: 500, // Limit for performance
    });

    // Calculate summary
    const summary = {
      totalIncome: transactions
        .filter(t => t.category === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
      totalExpenses: transactions
        .filter(t => t.category === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
      totalBills: transactions
        .filter(t => t.category === 'bill')
        .reduce((sum, t) => sum + t.amount, 0),
      unreviewedCount: transactions.filter(t => !t.isReviewed).length,
      fixedSpending: transactions
        .filter(t => t.spendingType === 'fixed')
        .reduce((sum, t) => sum + t.amount, 0),
      flexibleSpending: transactions
        .filter(t => t.spendingType === 'flexible')
        .reduce((sum, t) => sum + t.amount, 0),
      discretionarySpending: transactions
        .filter(t => t.spendingType === 'discretionary')
        .reduce((sum, t) => sum + t.amount, 0),
    };

    return NextResponse.json({
      success: true,
      transactions,
      summary,
    });
  } catch (error) {
    console.error('[Transactions GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

/**
 * Update transaction categorization
 * PATCH /api/transactions
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId, updates } = await request.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
    }

    // Verify ownership
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction || transaction.userId !== user.id) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check if user is changing the categorization
    const wasRecategorized =
      (updates.category && updates.category !== transaction.aiCategory) ||
      (updates.subcategory && updates.subcategory !== transaction.aiSubcategory) ||
      (updates.spendingType && updates.spendingType !== transaction.spendingType);

    // Update transaction
    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...updates,
        wasRecategorized: wasRecategorized || transaction.wasRecategorized,
        isReviewed: true,
        updatedAt: new Date(),
      },
    });

    // Learn from user's categorization for similar merchants
    if (wasRecategorized && transaction.merchantName) {
      const merchantMapping = await prisma.merchantMapping.findUnique({
        where: {
          userId_normalizedName: {
            userId: user.id,
            normalizedName: transaction.merchantName.toLowerCase(),
          },
        },
      });

      if (merchantMapping) {
        // Update existing mapping
        await prisma.merchantMapping.update({
          where: { id: merchantMapping.id },
          data: {
            category: updates.category || transaction.category,
            subcategory: updates.subcategory || transaction.subcategory,
            spendingType: updates.spendingType || transaction.spendingType,
            useCount: { increment: 1 },
          },
        });
      } else {
        // Create new mapping
        await prisma.merchantMapping.create({
          data: {
            userId: user.id,
            merchantName: transaction.merchantName,
            normalizedName: transaction.merchantName.toLowerCase(),
            category: updates.category || transaction.category,
            subcategory: updates.subcategory || transaction.subcategory,
            spendingType: updates.spendingType || transaction.spendingType,
            isUserDefined: true,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      transaction: updated,
    });
  } catch (error) {
    console.error('[Transactions PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

/**
 * Bulk update transactions
 * POST /api/transactions/bulk-update
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionIds, updates } = await request.json();

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json({ error: 'Transaction IDs required' }, { status: 400 });
    }

    // Verify all transactions belong to user
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
    });

    if (transactions.length !== transactionIds.length) {
      return NextResponse.json({ error: 'Some transactions not found' }, { status: 404 });
    }

    // Bulk update
    await prisma.transaction.updateMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
      data: {
        ...updates,
        isReviewed: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      updated: transactionIds.length,
    });
  } catch (error) {
    console.error('[Transactions Bulk Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update transactions' },
      { status: 500 }
    );
  }
}
