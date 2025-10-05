import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { parseStatement, ParsedTransaction, isDuplicateTransaction } from '@/lib/transaction-parser';

/**
 * Import bank statement transactions
 * POST /api/transactions/import
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user profile exists
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    let fileType: 'csv' | 'pdf';
    if (file.name.endsWith('.csv')) {
      fileType = 'csv';
    } else if (file.name.endsWith('.pdf')) {
      fileType = 'pdf';
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a CSV or PDF file.' },
        { status: 400 }
      );
    }

    // Read file content as buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Parse transactions
    let parsedTransactions: ParsedTransaction[];
    try {
      parsedTransactions = await parseStatement(fileBuffer, fileType);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse file';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    if (parsedTransactions.length === 0) {
      return NextResponse.json(
        { error: 'No valid transactions found in file' },
        { status: 400 }
      );
    }

    // Create import record
    const statementImport = await prisma.statementImport.create({
      data: {
        userId: user.id,
        fileName: file.name,
        fileType,
        status: 'processing',
        totalTransactions: parsedTransactions.length,
        processedTransactions: 0,
      },
    });

    // Check for duplicates against existing transactions
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: new Date(Math.min(...parsedTransactions.map(t => t.date.getTime()))),
          lte: new Date(Math.max(...parsedTransactions.map(t => t.date.getTime()))),
        },
      },
    });

    // Filter out duplicates
    const newTransactions = parsedTransactions.filter(parsed => {
      return !existingTransactions.some(existing =>
        isDuplicateTransaction(
          parsed,
          {
            date: new Date(existing.date),
            description: existing.description,
            amount: existing.amount,
            transactionType: existing.transactionType as 'debit' | 'credit',
          }
        )
      );
    });

    // Batch categorize transactions using AI
    const categorizationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/transactions/categorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions: newTransactions.map(t => ({
          description: t.description,
          amount: t.amount,
          merchantName: t.merchantName,
          date: t.date.toISOString(),
        })),
      }),
    });

    let categorizations = [];
    if (categorizationResponse.ok) {
      const result = await categorizationResponse.json();
      categorizations = result.categorizations || [];
    }

    // Save transactions to database
    const savedTransactions = await Promise.all(
      newTransactions.map((transaction, index) => {
        // Fallback categorization if AI fails
        let fallbackCategory: 'income' | 'expense' | 'bill' | 'savings' | 'debt' | 'transfer' = 'expense';
        let fallbackSubcategory = 'Uncategorized';

        // Use transaction type and description to make a better guess
        if (transaction.transactionType === 'credit') {
          const desc = transaction.description.toLowerCase();
          if (desc.includes('deposit') || desc.includes('salary') || desc.includes('paycheck') ||
              desc.includes('payment from') || desc.includes('zelle payment from') ||
              desc.includes('venmo') || desc.includes('transfer from')) {
            fallbackCategory = 'income';
            fallbackSubcategory = 'Deposit';
          } else if (desc.includes('refund') || desc.includes('return')) {
            fallbackCategory = 'income';
            fallbackSubcategory = 'Refund';
          }
        }

        const cat = categorizations[index] || {
          category: fallbackCategory,
          subcategory: fallbackSubcategory,
          spendingType: 'flexible',
          confidence: 0,
          isRecurring: false,
        };

        return prisma.transaction.create({
          data: {
            userId: user.id,
            importId: statementImport.id,
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            transactionType: transaction.transactionType,
            merchantName: transaction.merchantName,

            // AI categorization
            aiCategory: cat.category,
            aiSubcategory: cat.subcategory,
            aiConfidence: cat.confidence,

            // Initial user categorization (same as AI)
            category: cat.category,
            subcategory: cat.subcategory,
            spendingType: cat.spendingType,

            // Recurring detection
            isRecurring: cat.isRecurring,
            recurringPattern: cat.recurringPattern || null,
          },
        });
      })
    );

    // Update import status
    await prisma.statementImport.update({
      where: { id: statementImport.id },
      data: {
        status: 'completed',
        processedTransactions: savedTransactions.length,
      },
    });

    return NextResponse.json({
      success: true,
      importId: statementImport.id,
      totalParsed: parsedTransactions.length,
      duplicatesSkipped: parsedTransactions.length - newTransactions.length,
      transactionsImported: savedTransactions.length,
    });
  } catch (error: unknown) {
    console.error('[Transaction Import] Full error:', error);
    if (error instanceof Error) {
      console.error('[Transaction Import] Error message:', error.message);
      console.error('[Transaction Import] Error stack:', error.stack);

      // Check if it's a Prisma error
      if ('code' in error) {
        const prismaError = error as { code?: string; meta?: unknown };
        console.error('[Transaction Import] Prisma error code:', prismaError.code);
        console.error('[Transaction Import] Prisma meta:', prismaError.meta);
      }
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to import transactions';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Get import history
 * GET /api/transactions/import
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const imports = await prisma.statementImport.findMany({
      where: { userId: user.id },
      orderBy: { importDate: 'desc' },
      take: 20,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json({ success: true, imports });
  } catch (error) {
    console.error('[Transaction Import GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch imports' },
      { status: 500 }
    );
  }
}
