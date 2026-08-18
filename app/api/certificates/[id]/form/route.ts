import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

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

    // Delete existing form fields
    await prisma.formField.deleteMany({
      where: { certificateId: id },
    });

    // Create new form fields
    const created = await Promise.all(
      formFields.map((f: Record<string, unknown>, index: number) =>
        prisma.formField.create({
          data: {
            certificateId: id,
            datasetColumnId: f.datasetColumnId as string,
            label: (f.label as string) || 'Field',
            inputType: (f.inputType as string) || 'text',
            required: f.required !== false,
            sortOrder: index,
          },
          include: { datasetColumn: true },
        })
      )
    );

    return NextResponse.json({ formFields: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
