import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/certificates/:id/form
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const formFields = await prisma.formField.findMany({
      where: { certificateId: id },
      include: { datasetColumn: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ formFields });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/certificates/:id/form - Configure public form fields
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    const { formFields } = await request.json();

    if (!Array.isArray(formFields)) {
      return NextResponse.json({ error: 'formFields array is required' }, { status: 400 });
    }

    // Get all valid column IDs for this certificate's datasets to prevent foreign key errors
    const validColumns = await prisma.datasetColumn.findMany({
      where: { dataset: { certificateId: id } },
      select: { id: true },
    });
    const validColumnIdSet = new Set(validColumns.map((c) => c.id));

    // Filter to only valid column references
    const sanitizedFields = formFields
      .filter((f: Record<string, unknown>) => f.datasetColumnId && validColumnIdSet.has(f.datasetColumnId as string))
      .map((f: Record<string, unknown>, index: number) => ({
        id: uuidv4(),
        certificateId: id,
        datasetColumnId: f.datasetColumnId as string,
        label: (f.label as string) || 'Field',
        inputType: (f.inputType as string) || 'text',
        required: f.required !== false,
        sortOrder: index,
      }));

    // Delete existing form fields
    await prisma.formField.deleteMany({
      where: { certificateId: id },
    });

    // Create new form fields in a single bulk INSERT
    if (sanitizedFields.length > 0) {
      await prisma.formField.createMany({
        data: sanitizedFields,
      });
    }

    const created = await prisma.formField.findMany({
      where: { certificateId: id },
      include: { datasetColumn: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ formFields: created }, { status: 201 });
  } catch (error) {
    console.error('Save form fields error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
