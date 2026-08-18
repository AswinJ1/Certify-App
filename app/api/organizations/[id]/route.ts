import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, canAccessOrganization } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/organizations/:id
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const hasAccess = await canAccessOrganization(user.id, id, user.role);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        events: {
          include: { _count: { select: { certificates: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { events: true, members: true } },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ organization });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// PUT /api/organizations/:id
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const hasAccess = await canAccessOrganization(user.id, id, user.role);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        logo: body.logo,
        status: body.status,
      },
    });

    await createAuditLog({
      userId: user.id,
      organizationId: id,
      action: 'UPDATE',
      entityType: 'ORGANIZATION',
      entityId: id,
    });

    return NextResponse.json({ organization });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/organizations/:id
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only SUPER_ADMIN can delete organizations' }, { status: 403 });
    }

    await prisma.organization.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      organizationId: id,
      action: 'DELETE',
      entityType: 'ORGANIZATION',
      entityId: id,
    });

    return NextResponse.json({ message: 'Organization deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
