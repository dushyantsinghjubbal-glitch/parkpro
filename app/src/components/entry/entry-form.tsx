'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { parkCar } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScanLine, Smartphone, Camera, Loader2, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { LicensePlateScanner } from '@/components/entry/license-plate-scanner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : 'Park Car'}
    </Button>
  );
}

export function EntryForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [state, formAction, isPending] = useActionState(parkCar, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const licensePlateRef = useRef<HTMLInputElement>(null);
  const [hasApiKey, setHasApiKey] = useState(true); // Assume true initially

  useEffect(() => {
    // This check will only run on the client-side after hydration
    // A bit of a trick to check for a server-side env var from the client
    // We check if the button is disabled, which is done based on server-side env var presence
    const scanButton = document.getElementById('scan-button');
    if (scanButton && scanButton.hasAttribute('data-disabled')) {
        setHasApiKey(false);
    }
  }, []);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Success',
        description: state.success,
      });
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, toast, onSuccess]);

  const handleScanSuccess = (plate: string) => {
    if (licensePlateRef.current) {
      licensePlateRef.current.value = plate;
    }
    setScannerOpen(false);
    toast({
        title: 'Scan Successful',
        description: `License plate set to: ${plate}`,
    });
  };

  return (
    <>
      <form ref={formRef} action={formAction} className="space-y-6 pt-4">
        {!hasApiKey && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>API Key Missing</AlertTitle>
                <AlertDescription>
                  The license plate scanner is disabled. Please add your `GEMINI_API_KEY` to a `.env.local` file to enable it.
                </AlertDescription>
            </Alert>
        )}
        <div className="space-y-2">
            <Label>Customer Type</Label>
            <RadioGroup defaultValue="regular" name="customerType" className="flex gap-4">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="regular" id="r1" />
                    <Label htmlFor="r1">Regular</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="r2" />
                    <Label htmlFor="r2">Monthly Subscriber</Label>
                </div>
            </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="licensePlate">License Plate</Label>
          <div className="relative">
            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={licensePlateRef}
              id="licensePlate"
              name="licensePlate"
              placeholder="e.g., ABC-1234"
              required
              className="pl-10 pr-24"
              aria-describedby="plate-error"
            />
            <Button 
                id="scan-button"
                type="button" 
                variant="outline" 
                size="sm" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
                onClick={() => setScannerOpen(true)}
                disabled={!process.env.GEMINI_API_KEY}
                data-disabled={!process.env.GEMINI_API_KEY ? 'true' : undefined}
            >
                <Camera className="mr-2 h-4 w-4" /> Scan
            </Button>
          </div>
          {state?.error && 'licensePlate' in state.error && state.error.licensePlate && (
            <p id="plate-error" className="text-sm text-destructive">{state.error.licensePlate[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerMobile">Customer Mobile</Label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="customerMobile"
              name="customerMobile"
              type="tel"
              placeholder="e.g., 123-456-7890"
              required
              className="pl-10"
              aria-describedby="mobile-error"
            />
          </div>
          {state?.error && 'customerMobile' in state.error && state.error.customerMobile && (
            <p id="mobile-error" className="text-sm text-destructive">{state.error.customerMobile[0]}</p>
          )}
        </div>

        {state?.error && '_form' in state.error && state.error._form && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {state.error._form[0]}
            </AlertDescription>
          </Alert>
        )}

        <SubmitButton pending={isPending} />
      </form>
      <LicensePlateScanner 
        isOpen={isScannerOpen}
        onOpenChange={setScannerOpen}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
}
