import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET /api/organizer/settings
export async function GET() {
  try {
    const user = await requireAuth();
    let orgId = user.organizationMembers?.[0]?.organizationId;

    if (!orgId && user.role === 'SUPER_ADMIN') {
      const firstOrg = await prisma.organization.findFirst();
      orgId = firstOrg?.id;
    }

    if (!orgId) {
      return NextResponse.json({ organization: null });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    return NextResponse.json({ organization });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/organizer/settings
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    let orgId = user.organizationMembers?.[0]?.organizationId;

    if (!orgId && user.role === 'SUPER_ADMIN') {
      const firstOrg = await prisma.organization.findFirst();
      orgId = firstOrg?.id;
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No organization linked' }, { status: 400 });
    }

    const { name, email, logo } = await request.json();

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: name || undefined,
        email: email || undefined,
        logo: logo !== undefined ? logo : undefined,
      },
    });

    return NextResponse.json({ organization: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
