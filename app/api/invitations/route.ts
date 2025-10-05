import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

// Generate invitation link
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

    const { type, budgetId, message, expiresInDays = 7, maxUses = 1 } = await request.json();

    // Validate type
    if (!['partner', 'budget', 'both'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid invitation type. Must be "partner", "budget", or "both"' },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = nanoid(16);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        token,
        inviterId: user.id,
        inviterEmail: user.email || '',
        inviterName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'A friend',
        type,
        budgetId: budgetId || null,
        message: message || null,
        expiresAt,
        maxUses,
      },
    });

    // Generate shareable link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.budgetbear.app';
    const inviteLink = `${baseUrl}/invite/${token}`;

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        token: invitation.token,
        link: inviteLink,
        type: invitation.type,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('[Invitations API] Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation link' },
      { status: 500 }
    );
  }
}

// Get invitation by token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        inviterName: invitation.inviterName,
        inviterEmail: invitation.inviterEmail,
        type: invitation.type,
        message: invitation.message,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('[Invitations API] Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}
