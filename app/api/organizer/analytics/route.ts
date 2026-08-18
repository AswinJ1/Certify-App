import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET /api/organizer/analytics - Get organization-scoped analytics
export async function GET() {
  try {
    const user = await requireAuth();
    const orgId = user.organizationMembers?.[0]?.organizationId;

    if (!orgId && user.role !== 'SUPER_ADMIN') {
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
      });
    }

    const eventWhere = orgId ? { organizationId: orgId } : {};
    const certWhere = orgId ? { event: { organizationId: orgId } } : {};
    const dlWhere = orgId
      ? { generatedCertificate: { certificate: { event: { organizationId: orgId } } } }
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
        where: orgId ? { certificate: { event: { organizationId: orgId } } } : {},
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
        eventName: cert.event.name,
        orgName: cert.event.organization.name,
        recipients: cert._count.recipients,
        downloads,
      };
    }).sort((a, b) => b.downloads - a.downloads);

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
      const recipientData = log.generatedCertificate.recipient.data as Record<string, string>;
      const recipientName = recipientData['Name'] || recipientData['name'] ||
        recipientData['Student Name'] || recipientData['student_name'] ||
        Object.values(recipientData)[0] || 'Unknown';

      return {
        id: log.id,
        certName: log.generatedCertificate.certificate.name,
        recipientName,
        downloadedAt: log.downloadedAt,
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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
