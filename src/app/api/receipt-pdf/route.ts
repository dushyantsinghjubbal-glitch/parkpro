
import { NextResponse } from "next/server";
import { initializeServerApp } from "@/firebase/server-init";
import { doc, getDoc } from "firebase/firestore";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
  
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
    }
  
    return Buffer.concat(chunks);
  }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const receiptId = searchParams.get("id");
  const carId = searchParams.get("carId");

  if (!receiptId || !carId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const { firestore } = initializeServerApp();
    const receiptRef = doc(firestore, `parking_records/${carId}/receipts/${receiptId}`);
    const receiptSnap = await getDoc(receiptRef);

    if (!receiptSnap.exists()) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const receipt = receiptSnap.data();

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
    const fontSize = 12;
    const titleFontSize = 24;
    const x = 50;
    let y = height - 4 * titleFontSize;
    
    page.drawText('PARKING RECEIPT', {
      x: width / 2 - 100,
      y,
      font: boldFont,
      size: titleFontSize,
      color: rgb(0.247, 0.318, 0.71),
    });
    y -= 60;
  
    const drawLine = (label: string, value: string) => {
      page.drawText(label, { x, y, font: boldFont, size: fontSize });
      page.drawText(value, { x: 200, y, font, size: fontSize });
      y -= 25;
    };
    
    drawLine('Car Number:', receipt.carNumber);
    drawLine('Entry Time:', new Date(receipt.entryTime).toLocaleString());
    drawLine('Exit Time:', new Date(receipt.exitTime).toLocaleString());
    
    const durationHours = Math.floor(receipt.duration / 60);
    const durationMinutes = receipt.duration % 60;
    const durationString = `${durationHours}h ${durationMinutes}m`;
    drawLine('Duration:', durationString);
    y -= 10;
    
    page.drawLine({
      start: { x: x, y: y + 5 },
      end: { x: width - x, y: y + 5 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 20;
  
    page.drawText('Total Charges:', { x, y, font: boldFont, size: 16 });
    page.drawText(`Rs ${receipt.charges.toFixed(2)}`, { x: 200, y, font: boldFont, size: 16, color: rgb(0, 0.588, 0.533) });
    y -= 50;
  
    page.drawText('Thank you for parking with ParkPro!', {
        x: width / 2 - 120,
        y,
        font,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=receipt_${receiptId}.pdf`
      }
    });

  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
