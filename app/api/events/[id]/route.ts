import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, canAccessOrganization } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/events/:id
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true } },
        certificates: {
          include: {
            template: true,
            _count: { select: { recipients: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { certificates: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const hasAccess = await canAccessOrganization(user.id, event.organizationId, user.role);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/events/:id
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const hasAccess = await canAccessOrganization(user.id, existing.organizationId, user.role);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        logo: body.logo,
        status: body.status,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
    });

    await createAuditLog({
      userId: user.id,
      organizationId: existing.organizationId,
      eventId: id,
      action: 'UPDATE',
      entityType: 'EVENT',
      entityId: id,
    });

    return NextResponse.json({ event });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/events/:id
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const hasAccess = await canAccessOrganization(user.id, existing.organizationId, user.role);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.event.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      organizationId: existing.organizationId,
      eventId: id,
      action: 'DELETE',
      entityType: 'EVENT',
      entityId: id,
    });

    return NextResponse.json({ message: 'Event deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
