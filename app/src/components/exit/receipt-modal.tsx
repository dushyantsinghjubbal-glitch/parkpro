"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Hash, Calendar, Clock, Smartphone, Receipt } from "lucide-react";

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  receipt: {
    carNumber: string;
    entryTime: string;
    exitTime: string;
    parkingDuration: string;
    charges: number;
    receipt: string; // text receipt
    customerMobile?: string;
  } | null;
}

const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};


export function ReceiptModal({ open, onClose, receipt }: ReceiptModalProps) {
  if (!receipt) return null;

  const handleWhatsAppShare = () => {
    const message =
      `*** PARKING RECEIPT ***\n\n` +
      `Car: ${receipt.carNumber}\n` +
      `Entry: ${formatTime(receipt.entryTime)}\n` +
      `Exit: ${formatTime(receipt.exitTime)}\n` +
      `Duration: ${receipt.parkingDuration}\n` +
      `Total: Rs ${receipt.charges.toFixed(2)}\n\n` + 
      `${receipt.receipt}\n\n` +
      `Thank you for parking with us!`;

    const phone = receipt.customerMobile || "";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] sm:max-w-lg rounded-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Receipt /> Payment Receipt</DialogTitle>
          <DialogDescription>
              Receipt for vehicle <span className="font-bold font-mono">{receipt?.carNumber}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 text-sm">
            <div className="flex items-center"><Hash className="mr-3 h-4 w-4 text-muted-foreground"/><strong>License Plate:</strong><span className="ml-auto font-mono">{receipt?.carNumber}</span></div>
            <div className="flex items-center"><Calendar className="mr-3 h-4 w-4 text-muted-foreground"/><strong>Entry:</strong><span className="ml-auto text-right">{formatTime(receipt?.entryTime)}</span></div>
            <div className="flex items-center"><Calendar className="mr-3 h-4 w-4 text-muted-foreground"/><strong>Exit:</strong><span className="ml-auto text-right">{formatTime(receipt?.exitTime)}</span></div>
            <div className="flex items-center"><Clock className="mr-3 h-4 w-4 text-muted-foreground"/><strong>Duration:</strong><span className="ml-auto">{receipt?.parkingDuration}</span></div>
            <div className="flex items-center text-lg font-bold"><strong>Total:</strong><span className="ml-auto">Rs {receipt?.charges.toFixed(2)}</span></div>
        </div>

        {receipt?.receipt && (
        <>
            <Separator className="my-2"/>
            <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Generated Summary</p>
                <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                    {receipt.receipt}
                </div>
            </div>
        </>
        )}
        
        <DialogFooter className="sm:justify-start pt-4">
            <Button 
                onClick={handleWhatsAppShare}
                className="w-full" 
                size="lg"
            >
                <Smartphone className="mr-2 h-4 w-4"/> Share via WhatsApp
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
