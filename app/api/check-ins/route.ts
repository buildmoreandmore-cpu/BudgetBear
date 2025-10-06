import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// Get check-ins for a partnership
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partnershipId = searchParams.get('partnershipId');

    if (!partnershipId) {
      return NextResponse.json(
        { error: 'Partnership ID is required' },
        { status: 400 }
      );
    }

    // Verify user is part of this partnership
    const partnership = await prisma.partnership.findUnique({
      where: { id: partnershipId },
    });

    if (!partnership) {
      return NextResponse.json(
        { error: 'Partnership not found' },
        { status: 404 }
      );
    }

    if (partnership.userId !== user.id && partnership.partnerId !== user.id) {
      return NextResponse.json(
        { error: 'You are not part of this partnership' },
        { status: 403 }
      );
    }

    // Get all check-ins for this partnership
    const checkIns = await prisma.checkIn.findMany({
      where: { partnershipId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ checkIns });
  } catch (error) {
    console.error('[Check-ins API] Error fetching check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    );
  }
}

// Create a new check-in
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { partnershipId, message, progress } = await request.json();

    if (!partnershipId || !message) {
      return NextResponse.json(
        { error: 'Partnership ID and message are required' },
        { status: 400 }
      );
    }

    // Verify user is part of this partnership
    const partnership = await prisma.partnership.findUnique({
      where: { id: partnershipId },
    });

    if (!partnership) {
      return NextResponse.json(
        { error: 'Partnership not found' },
        { status: 404 }
      );
    }

    if (partnership.userId !== user.id && partnership.partnerId !== user.id) {
      return NextResponse.json(
        { error: 'You are not part of this partnership' },
        { status: 403 }
      );
    }

    // Create the check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        partnershipId,
        userId: user.id,
        message,
        progress: progress || null,
      },
    });

    return NextResponse.json({ checkIn });
  } catch (error) {
    console.error('[Check-ins API] Error creating check-in:', error);
    return NextResponse.json(
      { error: 'Failed to create check-in' },
      { status: 500 }
    );
  }
}
