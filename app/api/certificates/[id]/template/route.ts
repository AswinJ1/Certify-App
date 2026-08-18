import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/certificates/:id/template
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const template = await prisma.certificateTemplate.findUnique({
      where: { certificateId: id },
    });

    return NextResponse.json({ template });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/certificates/:id/template
// Client uploads via UploadThing first, then sends the URL here to save in DB
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    const { fileUrl, fileKey, fileName, metadata } = await request.json();

    if (!fileUrl) {
      return NextResponse.json({ error: 'fileUrl is required (upload via UploadThing first)' }, { status: 400 });
    }

    // Store the UploadThing URL as the fileKey
    const template = await prisma.certificateTemplate.upsert({
      where: { certificateId: id },
      update: {
        fileKey: fileUrl, // UploadThing URL
        metadata: metadata || { pageSize: 'A4', orientation: 'landscape', fileName, uploadThingKey: fileKey },
      },
      create: {
        certificateId: id,
        fileKey: fileUrl, // UploadThing URL
        metadata: metadata || { pageSize: 'A4', orientation: 'landscape', fileName, uploadThingKey: fileKey },
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
