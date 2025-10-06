import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';

// Create a shared budget
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, budgetData, sharedWithEmail, permission } = await request.json();

    // Look up user by email
    console.log('[Share API] Looking up user by email:', sharedWithEmail);
    const { data: users, error: lookupError } = await supabaseAdmin.auth.admin.listUsers();

    if (lookupError) {
      console.error('[Share API] Lookup error:', lookupError);
      return NextResponse.json(
        { error: `Unable to lookup user: ${lookupError.message}` },
        { status: 500 }
      );
    }

    console.log('[Share API] Found', users?.users?.length || 0, 'total users');

    const targetUser = users.users.find(u => u.email === sharedWithEmail);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found with that email. They must have a BudgetBear account first.' },
        { status: 404 }
      );
    }

    if (targetUser.id === user.id) {
      return NextResponse.json(
        { error: 'You cannot share a budget with yourself' },
        { status: 400 }
      );
    }

    // Ensure both users have profiles
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    await prisma.profile.upsert({
      where: { userId: targetUser.id },
      update: {},
      create: { userId: targetUser.id },
    });

    const sharedBudget = await prisma.sharedBudget.create({
      data: {
        name,
        description,
        budgetData,
        ownerId: user.id,
        sharedWith: [targetUser.id],
        permissions: { [targetUser.id]: permission },
      },
    });

    return NextResponse.json({ sharedBudget });
  } catch (error) {
    console.error('Error creating shared budget:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create shared budget: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Get shared budgets
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get budgets owned by user or shared with user
    const ownedBudgets = await prisma.sharedBudget.findMany({
      where: { ownerId: user.id },
    });

    const sharedBudgets = await prisma.sharedBudget.findMany({
      where: {
        sharedWith: {
          has: user.id,
        },
      },
    });

    return NextResponse.json({
      ownedBudgets,
      sharedBudgets,
    });
  } catch (error) {
    console.error('Error fetching shared budgets:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch shared budgets: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Update shared budget
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, budgetData, sharedWith, permissions } = await request.json();

    // Check if user has permission to update
    const existingBudget = await prisma.sharedBudget.findUnique({
      where: { id },
    });

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    const isOwner = existingBudget.ownerId === user.id;
    const existingPerms = existingBudget.permissions as Record<string, string> | null;
    const hasEditPermission = existingPerms && existingPerms[user.id] === 'edit';

    if (!isOwner && !hasEditPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const updatedBudget = await prisma.sharedBudget.update({
      where: { id },
      data: {
        budgetData,
        sharedWith: sharedWith || existingBudget.sharedWith,
        permissions: permissions || existingBudget.permissions,
      },
    });

    return NextResponse.json({ sharedBudget: updatedBudget });
  } catch (error) {
    console.error('Error updating shared budget:', error);
    return NextResponse.json(
      { error: 'Failed to update shared budget' },
      { status: 500 }
    );
  }
}

// Delete shared budget
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Budget ID required' }, { status: 400 });
    }

    const existingBudget = await prisma.sharedBudget.findUnique({
      where: { id },
    });

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    if (existingBudget.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only owner can delete budget' }, { status: 403 });
    }

    await prisma.sharedBudget.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shared budget:', error);
    return NextResponse.json(
      { error: 'Failed to delete shared budget' },
      { status: 500 }
    );
  }
}
