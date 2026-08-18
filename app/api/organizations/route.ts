import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, canAccessOrganization } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// GET /api/organizations - List organizations
export async function GET() {
  try {
    const user = await requireAuth();

    let organizations;
    if (user.role === 'SUPER_ADMIN') {
      organizations = await prisma.organization.findMany({
        include: {
          _count: { select: { events: true, members: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      organizations = await prisma.organization.findMany({
        where: {
          members: { some: { userId: user.id } },
        },
        include: {
          _count: { select: { events: true, members: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ organizations });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// POST /api/organizations - Create organization
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { name, email, logo } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const organization = await prisma.organization.create({
      data: { name, email: email || null, logo: logo || null },
    });

    // Add creator as member
    await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: user.role,
      },
    });

    await createAuditLog({
      userId: user.id,
      organizationId: organization.id,
      action: 'CREATE',
      entityType: 'ORGANIZATION',
      entityId: organization.id,
    });

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
