import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateCertificatePDF } from '@/lib/pdf-generator';

type RouteParams = { params: Promise<{ slug: string }> };

// POST /api/public/:slug/download - Generate and download certificate PDF
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { recipientId, certificateId, generatedCertificateId } = await request.json();

    if (!recipientId || !certificateId) {
      return NextResponse.json({ error: 'recipientId and certificateId are required' }, { status: 400 });
    }

    // Verify the certificate is published
    const certificate = await prisma.certificate.findUnique({
      where: { publicSlug: slug },
    });

    if (!certificate || certificate.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Certificate not found or not published' }, { status: 404 });
    }

    if (certificate.id !== certificateId) {
      return NextResponse.json({ error: 'Certificate mismatch' }, { status: 400 });
    }

    // Generate PDF dynamically with pdf-lib
    const pdfBytes = await generateCertificatePDF({
      certificateId,
      recipientId,
    });

    // Log the download
    if (generatedCertificateId) {
      await prisma.downloadLog.create({
        data: {
          generatedCertificateId,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          referrer: request.headers.get('referer') || null,
        },
      });
    }

    // Return PDF directly as download
    const pdfBuffer = Buffer.from(pdfBytes);
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${slug}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
