import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth();
    const orgId = user.organizationMembers?.[0]?.organizationId;

    if (!orgId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No organization assigned to this account' }, { status: 400 });
    }

    const eventWhere = orgId ? { organizationId: orgId } : {};
    const certWhere = orgId ? { event: { organizationId: orgId } } : {};

    const [eventsCount, certsCount, recipientsCount, downloadsCount] = await Promise.all([
      prisma.event.count({ where: eventWhere }),
      prisma.certificate.count({ where: certWhere }),
      prisma.recipient.count({
        where: orgId ? { certificate: { event: { organizationId: orgId } } } : {},
      }),
      prisma.downloadLog.count({
        where: orgId
          ? { generatedCertificate: { certificate: { event: { organizationId: orgId } } } }
          : {},
      }),
    ]);

    const recentEvents = await prisma.event.findMany({
      where: eventWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: { select: { certificates: true } },
      },
    });

    const recentCertificates = await prisma.certificate.findMany({
      where: certWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        event: true,
        _count: { select: { recipients: true, generatedCertificates: true } },
      },
    });

    return NextResponse.json({
      stats: {
        events: eventsCount,
        certificates: certsCount,
        recipients: recipientsCount,
        downloads: downloadsCount,
      },
      recentEvents,
      recentCertificates,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
