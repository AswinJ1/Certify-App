import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/certificates/:id/datasets
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const datasets = await prisma.dataset.findMany({
      where: { certificateId: id },
      include: { columns: { orderBy: { columnIndex: 'asc' } } },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ datasets });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/certificates/:id/datasets
// Client uploads CSV/XLSX to UploadThing first, then sends URL here.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    const { fileUrl, fileKey, fileName: rawFileName } = await request.json();

    if (!fileUrl) {
      return NextResponse.json({ error: 'fileUrl is required (upload via UploadThing first)' }, { status: 400 });
    }

    const fileName = rawFileName || 'dataset.xlsx';
    const ext = fileName.split('.').pop()?.toLowerCase() || 'xlsx';

    // Fetch the file from UploadThing URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch uploaded file from storage (Status: ${response.status})` }, { status: 500 });
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    // Parse the file to detect columns and rows
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch (parseErr) {
      console.error('XLSX Buffer Parse Error:', parseErr);
      return NextResponse.json({ error: 'Could not parse spreadsheet binary data. Please ensure file is a valid .xlsx or .csv.' }, { status: 400 });
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json({ error: 'Spreadsheet has no readable sheets' }, { status: 400 });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'Spreadsheet contains no data rows' }, { status: 400 });
    }

    const headers = Object.keys(jsonData[0]);
    const fileType = ext === 'csv' ? 'csv' : 'xlsx';

    // Delete old recipients for this certificate before importing new ones
    await prisma.recipient.deleteMany({ where: { certificateId: id } });

    // Create dataset record (store UploadThing URL)
    const dataset = await prisma.dataset.create({
      data: {
        certificateId: id,
        fileKey: fileUrl, // UploadThing URL
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

    // Auto-create fields & mappings if certificate currently has no fields
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

    return NextResponse.json({
      dataset: { ...dataset, columns },
      recipientCount: recipients.length,
      sampleData: jsonData.slice(0, 5),
    }, { status: 201 });
  } catch (error) {
    console.error('Dataset upload error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
