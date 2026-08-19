import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/certificates/:id/mappings
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const mappings = await prisma.fieldMapping.findMany({
      where: { certificateId: id },
      include: {
        datasetColumn: true,
        certificateField: true,
      },
    });

    return NextResponse.json({ mappings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/certificates/:id/mappings - Set all mappings
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    const { mappings } = await request.json();

    if (!Array.isArray(mappings)) {
      return NextResponse.json({ error: 'mappings array is required' }, { status: 400 });
    }

    // Support both { datasetColumnId, certificateFieldId } and { columnId, fieldId }
    const normalizedMappings = mappings
      .map((m: { datasetColumnId?: string; columnId?: string; certificateFieldId?: string; fieldId?: string }) => ({
        datasetColumnId: m.datasetColumnId || m.columnId,
        certificateFieldId: m.certificateFieldId || m.fieldId,
      }))
      .filter(
        (m): m is { datasetColumnId: string; certificateFieldId: string } =>
          Boolean(m.datasetColumnId && m.certificateFieldId)
      );

    // Delete existing mappings
    await prisma.fieldMapping.deleteMany({
      where: { certificateId: id },
    });

    // Create new mappings in bulk
    if (normalizedMappings.length > 0) {
      await prisma.fieldMapping.createMany({
        data: normalizedMappings.map((m) => ({
          id: uuidv4(),
          certificateId: id,
          datasetColumnId: m.datasetColumnId,
          certificateFieldId: m.certificateFieldId,
        })),
        skipDuplicates: true,
      });
    }

    const created = await prisma.fieldMapping.findMany({
      where: { certificateId: id },
      include: {
        datasetColumn: true,
        certificateField: true,
      },
    });

    return NextResponse.json({ mappings: created }, { status: 201 });
  } catch (error) {
    console.error('Save mappings error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
