import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteParams = { params: Promise<{ slug: string }> };

// Helper to get normalized value from JSON record regardless of key casing/spacing
function getRecordValue(data: Record<string, unknown>, targetKey: string): string {
  const cleanTarget = targetKey.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  for (const [k, v] of Object.entries(data)) {
    const cleanK = k.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (cleanK === cleanTarget) {
      return v !== null && v !== undefined ? String(v).trim() : '';
    }
  }
  return '';
}

// POST /api/public/:slug/search - Search for a recipient using form field values
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();

    // Load published certificate with form config
    const certificate = await prisma.certificate.findUnique({
      where: { publicSlug: slug },
      include: {
        formFields: {
          include: { datasetColumn: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!certificate || certificate.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Certificate not found or not published' }, { status: 404 });
    }

    // Extract submitted non-empty search terms
    const submittedEntries = Object.entries(body)
      .map(([k, v]) => [k, (v !== null && v !== undefined ? String(v) : '').trim()])
      .filter(([, v]) => v.length > 0);

    if (submittedEntries.length === 0) {
      return NextResponse.json(
        { error: 'Please enter your email, name, or other registered detail to search.' },
        { status: 400 }
      );
    }

    // Load all recipients for this certificate
    const recipients = await prisma.recipient.findMany({
      where: { certificateId: certificate.id },
    });

    // Find matching recipient (all provided non-empty search inputs must match)
    const matchedRecipient = recipients.find((recipient) => {
      const data = (recipient.data as Record<string, unknown>) || {};
      return submittedEntries.every(([queryKey, queryVal]) => {
        const storedVal = getRecordValue(data, queryKey);
        return storedVal.toLowerCase() === queryVal.toLowerCase();
      });
    });

    if (!matchedRecipient) {
      return NextResponse.json(
        {
          error: 'No matching certificate found. Please check your credentials and try again.',
          found: false,
        },
        { status: 404 }
      );
    }

    // Check if a generated certificate record exists, create one if not
    let genCert = await prisma.generatedCertificate.findFirst({
      where: {
        certificateId: certificate.id,
        recipientId: matchedRecipient.id,
      },
    });

    if (!genCert) {
      const certNumber = `CERT-${certificate.publicSlug.toUpperCase().slice(0, 8)}-${matchedRecipient.id.slice(0, 8)}`;
      genCert = await prisma.generatedCertificate.create({
        data: {
          certificateId: certificate.id,
          recipientId: matchedRecipient.id,
          certificateNumber: certNumber,
          status: 'GENERATED',
        },
      });
    }

    // Prepare display data for confirmation card
    const recipientData = (matchedRecipient.data as Record<string, unknown>) || {};
    const displayData: Record<string, string> = {};
    if (certificate.formFields.length > 0) {
      for (const field of certificate.formFields) {
        displayData[field.label] = getRecordValue(recipientData, field.datasetColumn.columnName);
      }
    } else {
      for (const [k, v] of Object.entries(recipientData)) {
        displayData[k] = v !== null && v !== undefined ? String(v) : '';
      }
    }

    return NextResponse.json({
      found: true,
      recipientId: matchedRecipient.id,
      certificateId: certificate.id,
      certificateNumber: genCert.certificateNumber,
      generatedCertificateId: genCert.id,
      data: displayData,
      displayData,
    });
  } catch (error) {
    console.error('Search error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
