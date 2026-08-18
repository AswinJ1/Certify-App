import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET /api/analytics - Get platform-wide analytics
export async function GET() {
  try {
    await requireAuth();

    // Total counts
    const [
      totalOrganizations,
      totalEvents,
      totalCertificates,
      totalRecipients,
      totalDownloads,
      totalGenerated,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.event.count(),
      prisma.certificate.count(),
      prisma.recipient.count(),
      prisma.downloadLog.count(),
      prisma.generatedCertificate.count(),
    ]);

    // Published certificates count
    const publishedCertificates = await prisma.certificate.count({
      where: { status: 'PUBLISHED' },
    });

    // Downloads per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDownloads = await prisma.downloadLog.findMany({
      where: { downloadedAt: { gte: thirtyDaysAgo } },
      select: { downloadedAt: true },
      orderBy: { downloadedAt: 'asc' },
    });

    // Group downloads by date
    const downloadsByDate: Record<string, number> = {};
    for (const dl of recentDownloads) {
      const date = dl.downloadedAt.toISOString().split('T')[0];
      downloadsByDate[date] = (downloadsByDate[date] || 0) + 1;
    }

    // Fill in missing dates in the last 30 days
    const dailyDownloads: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyDownloads.push({ date: dateStr, count: downloadsByDate[dateStr] || 0 });
    }

    // Top certificates by download count
    const topCertificates = await prisma.certificate.findMany({
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

    // Recent downloads with details
    const recentDownloadLogs = await prisma.downloadLog.findMany({
      take: 20,
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
        totalOrganizations,
        totalEvents,
        totalCertificates,
        publishedCertificates,
        totalRecipients,
        totalDownloads,
        totalGenerated,
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
