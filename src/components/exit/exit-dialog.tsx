'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ExitFlow } from '@/components/exit/exit-flow';
import { useEffect, useState } from 'react';

type ExitDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
};

export function ExitDialog({ isOpen, onOpenChange }: ExitDialogProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleSuccess = () => {
        onOpenChange(false);
    };

    if (!isClient) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] max-w-2xl rounded-md">
                 <DialogHeader>
                    <DialogTitle>Find Car for Checkout</DialogTitle>
                    <DialogDescription>Enter the license plate to find the parked car and generate a receipt.</DialogDescription>
                </DialogHeader>
                <ExitFlow onSuccess={handleSuccess} />
            </DialogContent>
        </Dialog>
    );
}
