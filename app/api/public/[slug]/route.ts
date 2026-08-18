import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteParams = { params: Promise<{ slug: string }> };

// GET /api/public/:slug - Load published certificate config + form fields + logos
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const certificate = await prisma.certificate.findUnique({
      where: { publicSlug: slug },
      include: {
        event: {
          include: {
            organization: { select: { id: true, name: true, logo: true, email: true } },
          },
        },
        formFields: {
          include: { datasetColumn: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    if (certificate.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Certificate is not published' }, { status: 404 });
    }

    return NextResponse.json({
      certificate: {
        id: certificate.id,
        name: certificate.name,
        publicSlug: certificate.publicSlug,
        event: {
          name: certificate.event.name,
          description: certificate.event.description,
          logo: certificate.event.logo,
          organization: certificate.event.organization,
        },
        formFields: certificate.formFields.map((f: {
          id: string; label: string; inputType: string; required: boolean;
          datasetColumn: { columnName: string };
        }) => ({
          id: f.id,
          label: f.label,
          inputType: f.inputType,
          required: f.required,
          columnName: f.datasetColumn.columnName,
        })),
      },
    });
  } catch (error) {
    console.error('Public slug load error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
