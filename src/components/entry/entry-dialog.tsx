'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EntryForm } from '@/components/entry/entry-form';
import { useEffect, useState } from 'react';

type EntryDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
};

export function EntryDialog({ isOpen, onOpenChange }: EntryDialogProps) {
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
            <DialogContent className="w-[90vw] max-w-md rounded-md">
                <DialogHeader>
                    <DialogTitle>Register a New Car</DialogTitle>
                    <DialogDescription>Scan or enter the license plate and customer's mobile to begin parking.</DialogDescription>
                </DialogHeader>
                <EntryForm onSuccess={handleSuccess} />
            </DialogContent>
        </Dialog>
    );
}
