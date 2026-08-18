import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, canAccessOrganization } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { v4 as uuidv4 } from 'uuid';

// GET /api/certificates
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    let where: Record<string, unknown> = {};
    if (eventId) {
      where.eventId = eventId;
    }

    if (user.role !== 'SUPER_ADMIN') {
      const memberships = await prisma.organizationMember.findMany({
        where: { userId: user.id },
        select: { organizationId: true },
      });
      const orgIds = memberships.map((m: { organizationId: string }) => m.organizationId);
      where.event = { organizationId: { in: orgIds } };
    }

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        event: {
          include: { organization: { select: { id: true, name: true } } },
        },
        _count: { select: { recipients: true, fields: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ certificates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/certificates
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (!body.name || !body.eventId) {
      return NextResponse.json({ error: 'Name and eventId are required' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: body.eventId } });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const hasAccess = await canAccessOrganization(user.id, event.organizationId, user.role);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + uuidv4().substring(0, 8);

    const certificate = await prisma.certificate.create({
      data: {
        eventId: body.eventId,
        name: body.name,
        publicSlug: slug,
      },
    });

    await createAuditLog({
      userId: user.id,
      organizationId: event.organizationId,
      eventId: event.id,
      action: 'CREATE',
      entityType: 'CERTIFICATE',
      entityId: certificate.id,
    });

    return NextResponse.json({ certificate }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
