
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { initializeServerApp } from '@/firebase/server-init';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Receipt } from '@/lib/types';
import { calculateDuration } from '@/lib/utils';


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const carId = searchParams.get('carId');

  if (!id || !carId) {
    return new NextResponse('Missing required query parameters: id, carId', { status: 400 });
  }

  try {
    const { firestore } = initializeServerApp();
    const receiptRef = doc(firestore, `parking_records/${carId}/receipts`, id);
    const receiptSnap = await getDoc(receiptRef);

    if (!receiptSnap.exists()) {
      return new NextResponse('Receipt not found', { status: 404 });
    }

    const receiptData = receiptSnap.data() as Receipt;
    const duration = calculateDuration(receiptData.entryTime, receiptData.exitTime);

    // Generate PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fontSize = 12;
    const titleFontSize = 24;
    const x = 50;
    let y = height - 4 * titleFontSize;
    
    // Title
    page.drawText('PARKING RECEIPT', {
      x: width / 2 - 100,
      y,
      font: boldFont,
      size: titleFontSize,
      color: rgb(0.247, 0.318, 0.71), // #3F51B5
    });
    y -= 60;

    // Details
    const drawLine = (label: string, value: string) => {
      page.drawText(label, { x, y, font: boldFont, size: fontSize });
      page.drawText(value, { x: 200, y, font, size: fontSize });
      y -= 25;
    };
    
    drawLine('Car Number:', receiptData.carNumber);
    drawLine('Entry Time:', new Date(receiptData.entryTime).toLocaleString());
    drawLine('Exit Time:', new Date(receiptData.exitTime).toLocaleString());
    drawLine('Duration:', duration.formatted);
    y -= 10;
    
    // Total
    page.drawLine({
      start: { x: x, y: y + 5 },
      end: { x: width - x, y: y + 5 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 20;

    page.drawText('Total Charges:', { x, y, font: boldFont, size: 16 });
    page.drawText(`Rs ${receiptData.charges.toFixed(2)}`, { x: 200, y, font: boldFont, size: 16, color: rgb(0, 0.588, 0.533) }); // #009688
    y -= 50;

    // Footer
    page.drawText('Thank you for parking with ParkPro!', {
        x: width / 2 - 120,
        y,
        font,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receipt-${receiptData.carNumber}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return new NextResponse('Failed to generate PDF', { status: 500 });
  }
}
