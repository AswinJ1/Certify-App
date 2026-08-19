import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, canAccessOrganization } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { v4 as uuidv4 } from 'uuid';

// GET /api/events - List events (filtered by org for ORG_ADMIN)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    let where = {};
    if (user.role === 'SUPER_ADMIN') {
      if (organizationId) where = { organizationId };
    } else {
      // ORG_ADMIN: only events from their orgs
      const memberships = await prisma.organizationMember.findMany({
        where: { userId: user.id },
        select: { organizationId: true },
      });
      const orgIds = memberships.map((m: { organizationId: string }) => m.organizationId);
      where = organizationId
        ? { organizationId, organizationId_in: orgIds }
        : { organizationId: { in: orgIds } };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true, logo: true } },
        _count: { select: { certificates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// POST /api/events - Create event
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (!body.name || !body.organizationId) {
      return NextResponse.json({ error: 'Name and organizationId are required' }, { status: 400 });
    }

    const hasAccess = await canAccessOrganization(user.id, body.organizationId, user.role);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + uuidv4().substring(0, 8);

    const event = await prisma.event.create({
      data: {
        organizationId: body.organizationId,
        name: body.name,
        description: body.description || null,
        logo: body.logo || null,
        publicSlug: slug,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });

    await createAuditLog({
      userId: user.id,
      organizationId: body.organizationId,
      eventId: event.id,
      action: 'CREATE',
      entityType: 'EVENT',
      entityId: event.id,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
