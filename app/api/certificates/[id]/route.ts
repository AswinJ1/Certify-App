import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, canAccessOrganization } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/certificates/:id
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        event: {
          include: { organization: { select: { id: true, name: true, logo: true } } },
        },
        template: true,
        fields: { orderBy: { sortOrder: 'asc' } },
        datasets: {
          include: { columns: { orderBy: { columnIndex: 'asc' } } },
          orderBy: { uploadedAt: 'desc' },
        },
        mappings: {
          include: {
            datasetColumn: true,
            certificateField: true,
          },
        },
        formFields: {
          include: { datasetColumn: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { recipients: true } },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const hasAccess = await canAccessOrganization(user.id, certificate.event.organizationId, user.role);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ certificate });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/certificates/:id
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.certificate.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const hasAccess = await canAccessOrganization(user.id, existing.event.organizationId, user.role);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const certificate = await prisma.certificate.update({
      where: { id },
      data: {
        name: body.name,
        status: body.status,
      },
    });

    await createAuditLog({
      userId: user.id,
      organizationId: existing.event.organizationId,
      eventId: existing.eventId,
      action: 'UPDATE',
      entityType: 'CERTIFICATE',
      entityId: id,
    });

    return NextResponse.json({ certificate });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/certificates/:id
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await prisma.certificate.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const hasAccess = await canAccessOrganization(user.id, existing.event.organizationId, user.role);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.certificate.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      organizationId: existing.event.organizationId,
      eventId: existing.eventId,
      action: 'DELETE',
      entityType: 'CERTIFICATE',
      entityId: id,
    });

    return NextResponse.json({ message: 'Certificate deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
