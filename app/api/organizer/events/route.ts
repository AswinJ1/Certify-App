import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/organizer/events
export async function GET() {
  try {
    const user = await requireAuth();
    const orgId = user.organizationMembers?.[0]?.organizationId;

    if (!orgId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ events: [] });
    }

    const events = await prisma.event.findMany({
      where: orgId ? { organizationId: orgId } : {},
      include: {
        organization: { select: { id: true, name: true } },
        _count: { select: { certificates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/organizer/events
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const orgId = user.organizationMembers?.[0]?.organizationId;

    if (!orgId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No organization linked to account' }, { status: 400 });
    }

    const { name, description, startDate, endDate, logo } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
    }

    const publicSlug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4().slice(0, 6)}`;

    const event = await prisma.event.create({
      data: {
        organizationId: orgId!,
        name,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        logo,
        publicSlug,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
