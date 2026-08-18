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

    // Delete old recipients for this certificate before importing new ones
    await prisma.recipient.deleteMany({ where: { certificateId: id } });

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

    // Create column records
    const columns = await Promise.all(
      headers.map((header, index) =>
        prisma.datasetColumn.create({
          data: {
            datasetId: dataset.id,
            columnName: header,
            dataType: 'string',
            columnIndex: index,
          },
        })
      )
    );

    // Check if certificate already has fields; if not, automatically populate fields & mappings from columns
    const existingFields = await prisma.certificateField.findMany({ where: { certificateId: id } });
    if (existingFields.length === 0) {
      const createdFields = await Promise.all(
        columns.map((col, idx) => {
          const rawName = col.columnName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '') || `field_${idx + 1}`;
          return prisma.certificateField.create({
            data: {
              certificateId: id,
              name: rawName,
              label: col.columnName,
              type: 'TEXT',
              positionX: 180,
              positionY: Math.min(500, 200 + (idx * 45)),
              width: 480,
              height: 38,
              fontFamily: idx === 0 ? 'HelveticaBold' : 'Helvetica',
              fontSize: idx === 0 ? 22 : 15,
              fontColor: '#1a1824',
              alignment: 'CENTER',
              required: idx === 0,
              sortOrder: idx,
            },
          });
        })
      );

      // Auto create field mappings with correct schema properties
      await Promise.all(
        createdFields.map((field, idx) => {
          const col = columns[idx];
          return prisma.fieldMapping.create({
            data: {
              certificateId: id,
              datasetColumnId: col.id,
              certificateFieldId: field.id,
            },
          });
        })
      );
    }

    // Create recipient records from each row
    const recipients = await Promise.all(
      jsonData.map((row) =>
        prisma.recipient.create({
          data: {
            certificateId: id,
            externalId: uuidv4().substring(0, 8),
            data: row as object,
          },
        })
      )
    );

    return NextResponse.json(
      {
        dataset: { ...dataset, columns },
        recipientCount: recipients.length,
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
