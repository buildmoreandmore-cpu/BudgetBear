import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// Get budget for a specific month/year
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json({ error: 'Year and month required' }, { status: 400 });
    }

    // Ensure user profile exists
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const budget = await prisma.budget.findUnique({
      where: {
        userId_year_month: {
          userId: user.id,
          year,
          month,
        },
      },
    });

    return NextResponse.json({ budget });
  } catch (error) {
    console.error('Error fetching budget:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    );
  }
}

// Save budget for a specific month/year
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year, month, budgetData } = await request.json();

    if (!year || !month || !budgetData) {
      return NextResponse.json({ error: 'Year, month, and budgetData required' }, { status: 400 });
    }

    // Ensure user profile exists
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const budget = await prisma.budget.upsert({
      where: {
        userId_year_month: {
          userId: user.id,
          year,
          month,
        },
      },
      update: {
        budgetData,
      },
      create: {
        userId: user.id,
        year,
        month,
        budgetData,
      },
    });

    return NextResponse.json({ budget });
  } catch (error) {
    console.error('Error saving budget:', error);
    return NextResponse.json(
      { error: 'Failed to save budget' },
      { status: 500 }
    );
  }
}

// Get all budgets for a user (used for year/month listing)
export async function PUT() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user profile exists
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const budgets = await prisma.budget.findMany({
      where: { userId: user.id },
      orderBy: [{ year: 'desc' }, { month: 'asc' }],
    });

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error('Error fetching all budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}
