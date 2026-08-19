import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth();
    const orgIds = user.organizationMembers?.map((m) => m.organizationId) || [];

    // Fallback for Super Admin if not explicitly attached to an organization member row
    if (orgIds.length === 0 && user.role === 'SUPER_ADMIN') {
      const allOrgs = await prisma.organization.findMany({ select: { id: true } });
      allOrgs.forEach((o) => orgIds.push(o.id));
    }

    if (orgIds.length === 0 && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({
        stats: {
          events: 0,
          certificates: 0,
          recipients: 0,
          downloads: 0,
        },
        recentEvents: [],
        recentCertificates: [],
      });
    }

    const eventWhere = orgIds.length > 0 ? { organizationId: { in: orgIds } } : {};
    const certWhere = orgIds.length > 0 ? { event: { organizationId: { in: orgIds } } } : {};
    const recipientWhere = orgIds.length > 0 ? { certificate: { event: { organizationId: { in: orgIds } } } } : {};
    const downloadWhere = orgIds.length > 0
      ? { generatedCertificate: { certificate: { event: { organizationId: { in: orgIds } } } } }
      : {};

    const [eventsCount, certsCount, recipientsCount, downloadsCount] = await Promise.all([
      prisma.event.count({ where: eventWhere }),
      prisma.certificate.count({ where: certWhere }),
      prisma.recipient.count({ where: recipientWhere }),
      prisma.downloadLog.count({ where: downloadWhere }),
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
        event: { select: { id: true, name: true } },
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
    console.error('Organizer stats error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
