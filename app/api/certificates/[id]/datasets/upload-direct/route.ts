import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/certificates/:id/datasets/upload-direct
// Direct server-side multipart/form-data upload for instant XLSX/CSV processing
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file was provided in the request' }, { status: 400 });
    }

    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
      return NextResponse.json({ error: 'Only CSV, XLSX, and XLS files are supported' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    if (!workbook.SheetNames.length) {
      return NextResponse.json({ error: 'Spreadsheet has no readable sheets' }, { status: 400 });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    if (!jsonData.length) {
      return NextResponse.json({ error: 'Spreadsheet is empty or has no data rows' }, { status: 400 });
    }

    const headers = Object.keys(jsonData[0]);
    const fileType = ext === 'csv' ? 'csv' : 'xlsx';

    // Clean up previous dataset records, recipients, form fields, and mappings for a clean replacement
    await prisma.formField.deleteMany({ where: { certificateId: id } });
    await prisma.fieldMapping.deleteMany({ where: { certificateId: id } });
    await prisma.recipient.deleteMany({ where: { certificateId: id } });
    await prisma.dataset.deleteMany({ where: { certificateId: id } });

    // Create dataset record
    const dataset = await prisma.dataset.create({
      data: {
        certificateId: id,
        fileKey: `local_${uuidv4().slice(0, 8)}_${fileName}`,
        fileName,
        fileType,
        status: 'PROCESSED',
        rowCount: jsonData.length,
      },
    });

    // Create column records with pre-generated UUIDs
    const columnData = headers.map((header, index) => ({
      id: uuidv4(),
      datasetId: dataset.id,
      columnName: header,
      dataType: 'string',
      columnIndex: index,
    }));

    await prisma.datasetColumn.createMany({
      data: columnData,
    });

    // Check if certificate already has fields; if not, automatically populate fields & mappings from columns
    const existingFields = await prisma.certificateField.findMany({ where: { certificateId: id } });
    let currentFields = existingFields;

    if (existingFields.length === 0) {
      const fieldData = columnData.map((col, idx) => {
        const rawName = col.columnName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '') || `field_${idx + 1}`;
        return {
          id: uuidv4(),
          certificateId: id,
          name: rawName,
          label: col.columnName,
          type: 'TEXT' as const,
          positionX: 180,
          positionY: Math.min(500, 200 + (idx * 45)),
          width: 480,
          height: 38,
          fontFamily: idx === 0 ? 'HelveticaBold' : 'Helvetica',
          fontSize: idx === 0 ? 22 : 15,
          fontColor: '#1a1824',
          alignment: 'CENTER' as const,
          required: idx === 0,
          sortOrder: idx,
        };
      });

      await prisma.certificateField.createMany({
        data: fieldData,
      });

      currentFields = await prisma.certificateField.findMany({ where: { certificateId: id } });
    }

    // Automatically map columns to matching certificate fields by name or index
    const mappingData = currentFields.map((field, idx) => {
      const matchingCol = columnData.find(
        (c) => c.columnName.toLowerCase() === field.name.toLowerCase() || c.columnName.toLowerCase() === field.label.toLowerCase()
      ) || columnData[idx];

      return matchingCol
        ? {
            id: uuidv4(),
            certificateId: id,
            datasetColumnId: matchingCol.id,
            certificateFieldId: field.id,
          }
        : null;
    }).filter(Boolean) as { id: string; certificateId: string; datasetColumnId: string; certificateFieldId: string }[];

    if (mappingData.length > 0) {
      await prisma.fieldMapping.createMany({
        data: mappingData,
      });
    }

    // Auto-create default lookup form fields for the first 1-2 primary columns
    const defaultFormCols = columnData.slice(0, 2);
    if (defaultFormCols.length > 0) {
      await prisma.formField.createMany({
        data: defaultFormCols.map((col, idx) => ({
          id: uuidv4(),
          certificateId: id,
          datasetColumnId: col.id,
          label: col.columnName,
          inputType: col.columnName.toLowerCase().includes('email') ? 'email' : 'text',
          required: true,
          sortOrder: idx,
        })),
      });
    }

    // Bulk insert recipients in chunks of 500
    const recipientData = jsonData.map((row) => ({
      id: uuidv4(),
      certificateId: id,
      externalId: uuidv4().substring(0, 8),
      data: row as object,
    }));

    const CHUNK_SIZE = 500;
    for (let i = 0; i < recipientData.length; i += CHUNK_SIZE) {
      const chunk = recipientData.slice(i, i + CHUNK_SIZE);
      await prisma.recipient.createMany({
        data: chunk,
      });
    }

    return NextResponse.json(
      {
        dataset: { ...dataset, columns: columnData },
        recipientCount: recipientData.length,
        sampleData: jsonData.slice(0, 5),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Direct dataset upload error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
