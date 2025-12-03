import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeServerApp } from "@/firebase/server-init";

/**
 * Generate and upload a PDF receipt to Firebase Storage
 */
export async function generateReceiptPDF(data: {
  carNumber: string;
  entryTime: string;
  exitTime: string;
  parkingDuration: string;
  charges: number;
}) {
  const { firebaseApp } = initializeServerApp();
  const storage = getStorage(firebaseApp);

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
  
  drawLine('Car Number:', data.carNumber);
  drawLine('Entry Time:', new Date(data.entryTime).toLocaleString());
  drawLine('Exit Time:', new Date(data.exitTime).toLocaleString());
  drawLine('Duration:', data.parkingDuration);
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
  page.drawText(`Rs ${data.charges.toFixed(2)}`, { x: 200, y, font: boldFont, size: 16, color: rgb(0, 0.588, 0.533) }); // #009688
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

  const pdfId = `receipt_${Date.now()}.pdf`;
  const storageRef = ref(storage, `receipts/${pdfId}`);

  await uploadBytes(storageRef, pdfBytes, {
    contentType: "application/pdf",
  });

  // Get public URL
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}
