import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/certificates/:id/fields
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const fields = await prisma.certificateField.findMany({
      where: { certificateId: id },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ fields });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/certificates/:id/fields - Create/replace all fields
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    const { fields } = await request.json();

    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: 'fields array is required' }, { status: 400 });
    }

    // Delete existing fields and recreate
    await prisma.certificateField.deleteMany({
      where: { certificateId: id },
    });

    const created = await Promise.all(
      fields.map((field: Record<string, unknown>, index: number) =>
        prisma.certificateField.create({
          data: {
            certificateId: id,
            name: field.name as string,
            label: (field.label as string) || (field.name as string),
            type: (field.type as 'TEXT' | 'DATE' | 'NUMBER' | 'EMAIL' | 'URL') || 'TEXT',
            positionX: (field.positionX as number) || 0,
            positionY: (field.positionY as number) || 0,
            width: (field.width as number) || 200,
            height: (field.height as number) || 30,
            fontFamily: (field.fontFamily as string) || 'Helvetica',
            fontSize: (field.fontSize as number) || 16,
            fontColor: (field.fontColor as string) || '#000000',
            alignment: (field.alignment as 'LEFT' | 'CENTER' | 'RIGHT') || 'CENTER',
            required: (field.required as boolean) || false,
            sortOrder: index,
          },
        })
      )
    );

    return NextResponse.json({ fields: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/certificates/:id/fields - Update individual fields
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    const { fields } = await request.json();

    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: 'fields array is required' }, { status: 400 });
    }

    const updated = await Promise.all(
      fields.map((field: Record<string, unknown>) => {
        if (field.id) {
          return prisma.certificateField.update({
            where: { id: field.id as string },
            data: {
              name: field.name as string,
              label: field.label as string,
              type: field.type as 'TEXT' | 'DATE' | 'NUMBER' | 'EMAIL' | 'URL',
              positionX: field.positionX as number,
              positionY: field.positionY as number,
              width: field.width as number,
              height: field.height as number,
              fontFamily: field.fontFamily as string,
              fontSize: field.fontSize as number,
              fontColor: field.fontColor as string,
              alignment: field.alignment as 'LEFT' | 'CENTER' | 'RIGHT',
              required: field.required as boolean,
              sortOrder: field.sortOrder as number,
            },
          });
        }
        return prisma.certificateField.create({
          data: {
            certificateId: id,
            name: field.name as string,
            label: (field.label as string) || (field.name as string),
            type: (field.type as 'TEXT' | 'DATE' | 'NUMBER' | 'EMAIL' | 'URL') || 'TEXT',
            positionX: (field.positionX as number) || 0,
            positionY: (field.positionY as number) || 0,
            width: (field.width as number) || 200,
            height: (field.height as number) || 30,
            fontFamily: (field.fontFamily as string) || 'Helvetica',
            fontSize: (field.fontSize as number) || 16,
            fontColor: (field.fontColor as string) || '#000000',
            alignment: (field.alignment as 'LEFT' | 'CENTER' | 'RIGHT') || 'CENTER',
            required: (field.required as boolean) || false,
            sortOrder: (field.sortOrder as number) || 0,
          },
        });
      })
    );

    return NextResponse.json({ fields: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
