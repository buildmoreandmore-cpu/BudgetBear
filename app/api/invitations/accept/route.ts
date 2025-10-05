import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// Accept an invitation (after user signs up or logs in)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Check if max uses reached
    if (invitation.usedCount >= invitation.maxUses) {
      return NextResponse.json(
        { error: 'Invitation has been fully used' },
        { status: 410 }
      );
    }

    // Check if user already used this invitation
    if (invitation.usedBy.includes(user.id)) {
      return NextResponse.json(
        { error: 'You have already accepted this invitation' },
        { status: 400 }
      );
    }

    // Can't accept own invitation
    if (invitation.inviterId === user.id) {
      return NextResponse.json(
        { error: 'You cannot accept your own invitation' },
        { status: 400 }
      );
    }

    // Update invitation usage
    await prisma.invitation.update({
      where: { token },
      data: {
        usedCount: { increment: 1 },
        usedBy: { push: user.id },
      },
    });

    // Create partnership if type includes 'partner' or 'both'
    if (invitation.type === 'partner' || invitation.type === 'both') {
      // Check if partnership already exists
      const existingPartnership = await prisma.partnership.findUnique({
        where: {
          userId_partnerId: {
            userId: user.id,
            partnerId: invitation.inviterId,
          },
        },
      });

      if (!existingPartnership) {
        // Create bidirectional partnerships
        await prisma.partnership.create({
          data: {
            userId: user.id,
            partnerId: invitation.inviterId,
            goalType: 'custom',
            active: true,
          },
        });

        await prisma.partnership.create({
          data: {
            userId: invitation.inviterId,
            partnerId: user.id,
            goalType: 'custom',
            active: true,
          },
        });
      }
    }

    // Share budget if type includes 'budget' or 'both' and budgetId exists
    if ((invitation.type === 'budget' || invitation.type === 'both') && invitation.budgetId) {
      const sharedBudget = await prisma.sharedBudget.findUnique({
        where: { id: invitation.budgetId },
      });

      if (sharedBudget) {
        // Add user to sharedWith array if not already there
        if (!sharedBudget.sharedWith.includes(user.id)) {
          const permissions = sharedBudget.permissions as Record<string, string>;
          permissions[user.id] = 'view';

          await prisma.sharedBudget.update({
            where: { id: invitation.budgetId },
            data: {
              sharedWith: { push: user.id },
              permissions: permissions,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      type: invitation.type,
    });
  } catch (error) {
    console.error('[Invitations Accept API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
