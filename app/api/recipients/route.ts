import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

// GET /api/recipients - Get paginated recipients across all certificates with PostgreSQL JSON search
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')));
    const certificateId = searchParams.get('certificateId');
    const search = searchParams.get('search');

    // Build where clause
    type WhereClause = {
      id?: { in: string[] };
      certificateId?: string;
      certificate?: { event: { organizationId: { in: string[] } } };
    };
    const where: WhereClause = {};
    if (certificateId) where.certificateId = certificateId;

    // ORG_ADMIN can only see their org's recipients
    let orgIds: string[] = [];
    if (user.role !== 'SUPER_ADMIN') {
      const memberships = await prisma.organizationMember.findMany({
        where: { userId: user.id },
        select: { organizationId: true },
      });
      orgIds = memberships.map((m: { organizationId: string }) => m.organizationId);
      where.certificate = { event: { organizationId: { in: orgIds } } };
    }

    // Database-level PostgreSQL JSON search across all 2,700+ rows
    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      const searchResults = await prisma.$queryRaw<{ id: string }[]>`
        SELECT r.id FROM recipients r
        JOIN certificates c ON r."certificateId" = c.id
        JOIN events e ON c."eventId" = e.id
        WHERE r.data::text ILIKE ${searchPattern}
        ${certificateId ? Prisma.raw(`AND r."certificateId" = '${certificateId}'`) : Prisma.empty}
        ${
          user.role !== 'SUPER_ADMIN' && orgIds.length > 0
            ? Prisma.raw(`AND e."organizationId" IN (${orgIds.map((id) => `'${id}'`).join(',')})`)
            : Prisma.empty
        }
      `;

      where.id = { in: searchResults.map((r) => r.id) };
    }

    const [recipients, total] = await Promise.all([
      prisma.recipient.findMany({
        where,
        include: {
          certificate: {
            select: {
              id: true,
              name: true,
              publicSlug: true,
              event: {
                select: {
                  name: true,
                  organization: { select: { name: true } },
                },
              },
            },
          },
          generatedCertificates: {
            include: {
              _count: { select: { downloadLogs: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.recipient.count({ where }),
    ]);

    // Process recipients to extract clean display data
    const processedRecipients = recipients.map((r) => {
      const data = (r.data as Record<string, unknown>) || {};
      const strData: Record<string, string> = {};
      Object.entries(data).forEach(([k, v]) => {
        strData[k] = v !== null && v !== undefined ? String(v) : '';
      });

      const downloads = r.generatedCertificates.reduce(
        (sum, gc) => sum + gc._count.downloadLogs,
        0
      );
      const hasGenerated = r.generatedCertificates.length > 0;

      // Extract clean name and email from dataset columns
      const nameKey = Object.keys(strData).find((k) =>
        ['name', 'student name', 'full name', 'participant name', 'recipient name', 'candidate name'].includes(
          k.toLowerCase().trim()
        )
      );
      const emailKey = Object.keys(strData).find((k) =>
        ['email', 'mail', 'email id', 'email address'].includes(k.toLowerCase().trim())
      );

      const displayName = nameKey ? strData[nameKey] : Object.values(strData)[0] || 'Participant';
      const email = emailKey ? strData[emailKey] : '';

      return {
        id: r.id,
        displayName,
        email,
        data: strData,
        certificateId: r.certificate.id,
        certificateName: r.certificate.name,
        publicSlug: r.certificate.publicSlug,
        eventName: r.certificate.event.name,
        orgName: r.certificate.event.organization.name,
        downloads,
        hasGenerated,
        createdAt: r.createdAt,
      };
    });

    // Certificates list for filter dropdown
    const certificates = await prisma.certificate.findMany({
      where:
        user.role !== 'SUPER_ADMIN'
          ? {
              event: {
                organizationId: { in: orgIds },
              },
            }
          : undefined,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      recipients: processedRecipients,
      certificates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Recipients API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
