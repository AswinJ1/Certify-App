import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { prisma } from '@/lib/db';

interface GenerateCertificateOptions {
  certificateId: string;
  recipientId: string;
}

/**
 * Generates a certificate PDF dynamically using pdf-lib.
 *
 * Flow:
 * 1. Load certificate config (fields, template, mappings)
 * 2. Load recipient data
 * 3. Fetch template from UploadThing URL or create blank page
 * 4. Place each field's value at its configured position with exact canvas-to-page coordinate scaling
 * 5. Return the PDF bytes (not stored permanently)
 */
export async function generateCertificatePDF(options: GenerateCertificateOptions): Promise<Uint8Array> {
  const { certificateId, recipientId } = options;

  // Load certificate with all relations
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: {
      template: true,
      fields: { orderBy: { sortOrder: 'asc' } },
      mappings: {
        include: {
          datasetColumn: true,
          certificateField: true,
        },
      },
      event: {
        include: { organization: true },
      },
    },
  });

  if (!certificate) throw new Error('Certificate not found');

  // Load recipient
  const recipient = await prisma.recipient.findUnique({
    where: { id: recipientId },
  });

  if (!recipient) throw new Error('Recipient not found');

  const recipientData = (recipient.data as Record<string, unknown>) || {};

  // Create PDF document
  let pdfDoc: PDFDocument;

  if (certificate.template?.fileKey) {
    try {
      const response = await fetch(certificate.template.fileKey);
      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.status}`);
      }
      const templateBytes = await response.arrayBuffer();

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('pdf')) {
        pdfDoc = await PDFDocument.load(templateBytes);
      } else if (contentType.includes('image')) {
        pdfDoc = await PDFDocument.create();
        let image;
        if (contentType.includes('png')) {
          image = await pdfDoc.embedPng(templateBytes);
        } else {
          image = await pdfDoc.embedJpg(templateBytes);
        }
        const { width, height } = image.scale(1);
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(image, { x: 0, y: 0, width, height });
      } else {
        pdfDoc = await PDFDocument.load(templateBytes);
      }
    } catch (err) {
      console.error('Error loading template from URL:', err);
      pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([842, 595]); // A4 Landscape
      page.drawRectangle({
        x: 20, y: 20, width: 802, height: 555,
        borderColor: rgb(0.2, 0.4, 0.7), borderWidth: 2,
      });
    }
  } else {
    pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    page.drawRectangle({
      x: 20, y: 20, width: 802, height: 555,
      borderColor: rgb(0.2, 0.4, 0.7), borderWidth: 2,
    });
    page.drawRectangle({
      x: 30, y: 30, width: 782, height: 535,
      borderColor: rgb(0.6, 0.7, 0.9), borderWidth: 1,
    });
  }

  const page = pdfDoc.getPages()[0];
  const { width: pageWidth, height: pageHeight } = page.getSize();

  // Reference canvas dimension is standard A4 landscape (842 x 595 pt)
  const CANVAS_REF_WIDTH = 842;
  const CANVAS_REF_HEIGHT = 595;

  const scaleX = pageWidth / CANVAS_REF_WIDTH;
  const scaleY = pageHeight / CANVAS_REF_HEIGHT;

  // Embed standard PDF fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);
  const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const fontMap: Record<string, typeof helvetica> = {
    'Helvetica': helvetica,
    'HelveticaBold': helveticaBold,
    'TimesRoman': timesRoman,
    'TimesRomanBold': timesRomanBold,
    'Courier': courier,
    'CourierBold': courierBold,
  };

  // Build field value mapping: field.name -> recipient value
  const valueMap: Record<string, string> = {};

  // 1. Check explicit mappings configured in FieldMapping table
  for (const mapping of certificate.mappings) {
    const columnName = mapping.datasetColumn.columnName;
    const fieldName = mapping.certificateField.name;
    const val = recipientData[columnName];
    if (val !== undefined && val !== null) {
      valueMap[fieldName] = String(val);
    }
  }

  // 2. Fallback: match by field name or label against recipient data keys
  for (const field of certificate.fields) {
    if (!valueMap[field.name]) {
      const matchKey = Object.keys(recipientData).find(
        (k) =>
          k.toLowerCase() === field.name.toLowerCase() ||
          k.toLowerCase() === field.label.toLowerCase() ||
          k.toLowerCase().replace(/[^a-z0-9]/g, '') === field.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (matchKey && recipientData[matchKey] !== undefined && recipientData[matchKey] !== null) {
        valueMap[field.name] = String(recipientData[matchKey]);
      }
    }
  }

  // Draw each certificate field at its exact configured position
  for (const field of certificate.fields) {
    const rawVal = valueMap[field.name] || '';
    if (!rawVal) continue;
    const value = String(rawVal).trim();
    if (!value) continue;

    const font = fontMap[field.fontFamily] || (field.fontFamily?.includes('Bold') ? helveticaBold : helvetica);
    const scaledFontSize = Math.max(8, Math.round((field.fontSize || 16) * scaleY));
    const color = hexToRgb(field.fontColor || '#000000');

    // Scale bounding box coordinates from 842x595 canvas to actual PDF page dimensions
    const boxX = (field.positionX || 0) * scaleX;
    const boxY = (field.positionY || 0) * scaleY;
    const boxW = (field.width || 200) * scaleX;
    const boxH = (field.height || 36) * scaleY;

    // In PDF coordinates, (0, 0) is bottom-left.
    // In Canvas coordinates, (0, 0) is top-left.
    // Text baseline is placed at vertical center of box:
    const y = pageHeight - boxY - (boxH / 2) - (scaledFontSize * 0.35);

    // Calculate horizontal alignment within box width
    const textWidth = font.widthOfTextAtSize(value, scaledFontSize);
    let x = boxX;
    if (field.alignment === 'CENTER') {
      x = boxX + (boxW - textWidth) / 2;
    } else if (field.alignment === 'RIGHT') {
      x = boxX + boxW - textWidth;
    }

    page.drawText(value, {
      x: Math.max(0, x),
      y: Math.max(0, y),
      size: scaledFontSize,
      font,
      color: rgb(color.r, color.g, color.b),
    });
  }

  return await pdfDoc.save();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}
