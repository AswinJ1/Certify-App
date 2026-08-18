import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/certificates/:id/publish
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        fields: true,
        datasets: { include: { columns: true } },
        mappings: true,
        formFields: true,
        _count: { select: { recipients: true } },
        event: true,
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Validation checks
    const errors: string[] = [];

    if (certificate.fields.length === 0) {
      errors.push('No certificate fields defined');
    }

    if (certificate.datasets.length === 0) {
      errors.push('No dataset uploaded');
    }

    if (certificate.mappings.length === 0) {
      errors.push('No field mappings configured');
    }

    if (certificate.formFields.length === 0) {
      errors.push('No public form fields configured');
    }

    if (certificate._count.recipients === 0) {
      errors.push('No recipients found');
    }

    if (errors.length > 0) {
      // Set status to DRAFT if validation fails
      await prisma.certificate.update({
        where: { id },
        data: { status: 'DRAFT' },
      });

      return NextResponse.json({
        error: 'Validation failed',
        errors,
        status: 'DRAFT',
      }, { status: 400 });
    }

    // All validations pass - publish
    const updated = await prisma.certificate.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: user.id,
      organizationId: certificate.event.organizationId,
      eventId: certificate.eventId,
      action: 'PUBLISH',
      entityType: 'CERTIFICATE',
      entityId: id,
    });

    return NextResponse.json({
      certificate: updated,
      publicUrl: `/c/${certificate.publicSlug}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
