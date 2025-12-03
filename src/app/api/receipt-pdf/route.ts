import { NextResponse } from "next/server";
import { initializeServerApp } from "@/firebase/server-init";
import { doc, getDoc } from "firebase/firestore";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

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

    // Create PDF stream
    const pdf = new PDFDocument();
    const stream = pdf.pipe(new Readable().wrap(pdf));

    // PDF Content
    pdf.fontSize(20).text("Parking Receipt", { align: "center" });
    pdf.moveDown();
    pdf.fontSize(12).text(`Car Number: ${receipt.carNumber}`);
    pdf.text(`Entry Time: ${receipt.entryTime}`);
    pdf.text(`Exit Time: ${receipt.exitTime}`);
    pdf.text(`Duration: ${receipt.duration} min`);
    pdf.text(`Total Charges: Rs. ${receipt.charges}`);
    pdf.end();

    return new Response(stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=receipt_${receiptId}.pdf`
      }
    });

  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
