import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET /api/organizer/analytics - Get organization-scoped analytics
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
        summary: {
          totalEvents: 0,
          totalCertificates: 0,
          publishedCertificates: 0,
          totalRecipients: 0,
          totalDownloads: 0,
        },
        dailyDownloads: [],
        topCertificates: [],
        recentActivity: [],
        eventCertificateDistribution: [],
      });
    }

    const eventWhere = orgIds.length > 0 ? { organizationId: { in: orgIds } } : {};
    const certWhere = orgIds.length > 0 ? { event: { organizationId: { in: orgIds } } } : {};
    const dlWhere = orgIds.length > 0
      ? { generatedCertificate: { certificate: { event: { organizationId: { in: orgIds } } } } }
      : {};

    const [
      totalEvents,
      totalCertificates,
      publishedCertificates,
      totalRecipients,
      totalDownloads,
    ] = await Promise.all([
      prisma.event.count({ where: eventWhere }),
      prisma.certificate.count({ where: certWhere }),
      prisma.certificate.count({ where: { ...certWhere, status: 'PUBLISHED' } }),
      prisma.recipient.count({
        where: orgIds.length > 0 ? { certificate: { event: { organizationId: { in: orgIds } } } } : {},
      }),
      prisma.downloadLog.count({ where: dlWhere }),
    ]);

    // Downloads per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDownloads = await prisma.downloadLog.findMany({
      where: {
        ...dlWhere,
        downloadedAt: { gte: thirtyDaysAgo },
      },
      select: { downloadedAt: true },
      orderBy: { downloadedAt: 'asc' },
    });

    const downloadsByDate: Record<string, number> = {};
    for (const dl of recentDownloads) {
      const date = dl.downloadedAt.toISOString().split('T')[0];
      downloadsByDate[date] = (downloadsByDate[date] || 0) + 1;
    }

    const dailyDownloads: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyDownloads.push({ date: dateStr, count: downloadsByDate[dateStr] || 0 });
    }

    // Top certificates
    const topCertificates = await prisma.certificate.findMany({
      where: certWhere,
      take: 10,
      include: {
        event: {
          include: { organization: { select: { name: true } } },
        },
        _count: { select: { recipients: true } },
        generatedCertificates: {
          include: {
            _count: { select: { downloadLogs: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const topCertsWithDownloads = topCertificates.map((cert) => {
      const downloads = cert.generatedCertificates.reduce(
        (sum, gc) => sum + gc._count.downloadLogs,
        0
      );
      return {
        id: cert.id,
        name: cert.name,
        status: cert.status,
        eventName: cert.event?.name || 'General Event',
        orgName: cert.event?.organization?.name || 'Organization',
        recipients: cert._count.recipients,
        downloads,
      };
    }).sort((a, b) => b.downloads - a.downloads);

    const eventCertificateDistribution = await prisma.event.findMany({
      where: eventWhere,
      select: {
        name: true,
        _count: {
          select: {
            certificates: true,
          },
        },
      },
      orderBy: {
        certificates: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // Recent downloads
    const recentDownloadLogs = await prisma.downloadLog.findMany({
      where: dlWhere,
      take: 15,
      orderBy: { downloadedAt: 'desc' },
      include: {
        generatedCertificate: {
          include: {
            certificate: { select: { name: true, publicSlug: true } },
            recipient: { select: { data: true } },
          },
        },
      },
    });

    const recentActivity = recentDownloadLogs.map((log) => {
      const recipientData = (log.generatedCertificate?.recipient?.data as Record<string, string>) || {};
      const recipientName = recipientData['Name'] || recipientData['name'] ||
        recipientData['Student Name'] || recipientData['student_name'] ||
        Object.values(recipientData)[0] || 'Unknown';

      return {
        id: log.id,
        certName: log.generatedCertificate?.certificate?.name || 'Certificate',
        recipientName,
        downloadedAt: log.downloadedAt.toISOString(),
        ipAddress: log.ipAddress,
      };
    });

    return NextResponse.json({
      summary: {
        totalEvents,
        totalCertificates,
        publishedCertificates,
        totalRecipients,
        totalDownloads,
      },
      dailyDownloads,
      topCertificates: topCertsWithDownloads,
      recentActivity,
      eventCertificateDistribution: eventCertificateDistribution
        .filter((event) => event._count.certificates > 0)
        .map((event) => ({
          eventName: event.name || 'Untitled Event',
          certificateCount: event._count.certificates,
        })),
    });
  } catch (error) {
    console.error('Organizer analytics error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
