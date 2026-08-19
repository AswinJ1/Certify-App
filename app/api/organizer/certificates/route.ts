import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/organizer/certificates
export async function GET() {
  try {
    const user = await requireAuth();
    const orgId = user.organizationMembers?.[0]?.organizationId;

    if (!orgId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ certificates: [] });
    }

    const certificates = await prisma.certificate.findMany({
      where: orgId ? { event: { organizationId: orgId } } : {},
      include: {
        template: true,
        event: {
          include: {
            organization: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: {
            recipients: true,
            fields: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ certificates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/organizer/certificates
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const orgId = user.organizationMembers?.[0]?.organizationId;

    const { name, eventId } = await request.json();

    if (!name || !eventId) {
      return NextResponse.json({ error: 'Name and eventId are required' }, { status: 400 });
    }

    // Verify the event belongs to this organization
    if (user.role !== 'SUPER_ADMIN') {
      const event = await prisma.event.findFirst({
        where: { id: eventId, organizationId: orgId! },
      });
      if (!event) {
        return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 403 });
      }
    }

    const publicSlug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4().slice(0, 6)}`;

    const certificate = await prisma.certificate.create({
      data: {
        eventId,
        name,
        publicSlug,
      },
    });

    return NextResponse.json({ certificate }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
