import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';

// Send partner request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { toUserEmail, message } = await request.json();

    // Look up user by email in Supabase Auth
    console.log('[Partners API] Looking up user by email:', toUserEmail);
    const { data: users, error: lookupError } = await supabaseAdmin.auth.admin.listUsers();

    if (lookupError) {
      console.error('[Partners API] Lookup error:', lookupError);
      return NextResponse.json(
        { error: `Unable to lookup user: ${lookupError.message}` },
        { status: 500 }
      );
    }

    console.log('[Partners API] Found', users?.users?.length || 0, 'total users');

    const targetUser = users.users.find(u => u.email === toUserEmail);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found with that email. They must have a BudgetBear account first.' },
        { status: 404 }
      );
    }

    if (targetUser.id === user.id) {
      return NextResponse.json(
        { error: 'You cannot send a partner request to yourself' },
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

    // Check if request already exists
    const existingRequest = await prisma.partnerRequest.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: user.id,
          toUserId: targetUser.id,
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Request already sent' },
        { status: 400 }
      );
    }

    const partnerRequest = await prisma.partnerRequest.create({
      data: {
        fromUserId: user.id,
        toUserId: targetUser.id,
        message: message || '',
        status: 'pending',
      },
    });

    return NextResponse.json({ partnerRequest });
  } catch (error) {
    console.error('Error creating partner request:', error);
    return NextResponse.json(
      { error: 'Failed to send partner request' },
      { status: 500 }
    );
  }
}

// Get partner requests
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sentRequests = await prisma.partnerRequest.findMany({
      where: { fromUserId: user.id },
    });

    const receivedRequests = await prisma.partnerRequest.findMany({
      where: { toUserId: user.id, status: 'pending' },
    });

    const partnerships = await prisma.partnership.findMany({
      where: {
        OR: [
          { userId: user.id },
          { partnerId: user.id },
        ],
        active: true,
      },
    });

    return NextResponse.json({
      sentRequests,
      receivedRequests,
      partnerships,
    });
  } catch (error) {
    console.error('Error fetching partner data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partner data' },
      { status: 500 }
    );
  }
}

// Accept/reject partner request
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, action, goalType, goalTarget, goalDetails } = await request.json();

    const partnerRequest = await prisma.partnerRequest.findUnique({
      where: { id: requestId },
    });

    if (!partnerRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (partnerRequest.toUserId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (action === 'accept') {
      // Update request status
      await prisma.partnerRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' },
      });

      // Create partnership
      const partnership = await prisma.partnership.create({
        data: {
          userId: partnerRequest.fromUserId,
          partnerId: user.id,
          goalType: goalType || 'custom',
          goalTarget,
          goalDetails,
          active: true,
        },
      });

      return NextResponse.json({ partnership });
    } else if (action === 'reject') {
      await prisma.partnerRequest.update({
        where: { id: requestId },
        data: { status: 'rejected' },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling partner request:', error);
    return NextResponse.json(
      { error: 'Failed to handle partner request' },
      { status: 500 }
    );
  }
}
