
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { findCarByLicensePlate, checkoutCar } from '@/lib/actions';
import type { ParkingRecord } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScanLine, Loader2, User, Calendar, Smartphone, Camera, Hash, Clock, Receipt, CarIcon } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { LicensePlateScanner } from '@/components/entry/license-plate-scanner';

const SearchSchema = z.object({
  licensePlate: z.string().min(1, 'License plate is required.'),
});

type ReceiptData = {
  carId: string;
  receiptId: string;
  carNumber: string;
  entryTime: string;
  exitTime: string;
  parkingDuration: string;
  charges: number;
  receipt: string;
  customerMobile: string;
};

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

export function ExitFlow({ onSuccess }: { onSuccess?: () => void }) {
  const [foundCars, setFoundCars] = useState<ParkingRecord[]>([]);
  const [selectedCar, setSelectedCar] = useState<ParkingRecord | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isSearching, startSearchTransition] = useTransition();
  const [isCheckingOut, startCheckoutTransition] = useTransition();
  const [isScannerOpen, setScannerOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof SearchSchema>>({
    resolver: zodResolver(SearchSchema),
    defaultValues: { licensePlate: '' },
  });

  const handleSearch = async (values: z.infer<typeof SearchSchema>) => {
    startSearchTransition(async () => {
      setFoundCars([]);
      setSelectedCar(null);
      const result = await findCarByLicensePlate(values.licensePlate);
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Search Failed',
          description: result.error,
        });
      } else if (result.success) {
        if (result.success.length === 1) {
            setSelectedCar(result.success[0]);
        } else {
            setFoundCars(result.success);
        }
      }
    });
  };

  const handleCheckout = async () => {
    if (!selectedCar) return;
    startCheckoutTransition(async () => {
        const result = await checkoutCar(selectedCar.id);
        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Checkout Failed',
                description: result.error,
            });
        } else if (result.success) {
            setReceiptData(result.success);
            setSelectedCar(null);
            setFoundCars([]);
            form.reset();
        }
    });
  };

  const handleScanSuccess = (plate: string) => {
    form.setValue('licensePlate', plate);
    setScannerOpen(false);
    toast({
        title: 'Scan Successful',
        description: `License plate set to: ${plate}`,
    });
    handleSearch({ licensePlate: plate });
  };

  const handleReceiptDialogClose = (open: boolean) => {
    if (!open) {
      setReceiptData(null);
      onSuccess?.();
    }
  }

  const handleReset = () => {
    form.reset();
    setFoundCars([]);
    setSelectedCar(null);
  };
  
  const showSearch = foundCars.length === 0 && selectedCar === null;

  const pdfUrl = receiptData ? `/api/receipt-pdf?id=${receiptData.receiptId}&carId=${receiptData.carId}` : '';

  return (
    <>
      <div className="w-full space-y-6 pt-4">
        {(showSearch || foundCars.length > 0) && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="flex flex-col sm:flex-row items-start gap-2">
              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel className="sr-only">License Plate</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="Scan or enter license plate" className="pl-10 pr-24" {...field} />
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
                            onClick={() => setScannerOpen(true)}
                            disabled={!process.env.GEMINI_API_KEY}
                        >
                            <Camera className="mr-2 h-4 w-4" /> Scan
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSearching} className="w-full sm:w-auto">
                {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Find Car
              </Button>
            </form>
          </Form>
        )}

        {isSearching && (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )}

        {foundCars.length > 0 && !selectedCar && (
            <Card className="animate-in fade-in">
                <CardHeader>
                    <CardTitle>Multiple Cars Found</CardTitle>
                    <CardDescription>Please select the correct car to check out.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup onValueChange={(carId) => setSelectedCar(foundCars.find(c => c.id === carId) || null)}>
                        <div className="space-y-2">
                            {foundCars.map(car => (
                                <Label key={car.id} htmlFor={car.id} className="flex items-center gap-4 border rounded-md p-3 hover:bg-accent has-[input:checked]:bg-accent has-[input:checked]:text-accent-foreground cursor-pointer">
                                    <RadioGroupItem value={car.id} id={car.id} />
                                    <div className="flex-1">
                                        <div className="font-semibold font-mono tracking-wider text-base">{car.licensePlate}</div>
                                        <div className="text-sm text-muted-foreground">Entered: {formatTime(car.entryTimestamp)}</div>
                                    </div>
                                </Label>
                            ))}
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>
        )}

        {selectedCar && (
          <Card className="animate-in fade-in">
            <CardHeader className='flex-row items-center justify-between'>
                <div>
                    <CardTitle>Confirm Checkout</CardTitle>
                    <Badge variant="secondary" className="text-base sm:text-lg font-semibold font-mono tracking-wider w-fit mt-2">{selectedCar.licensePlate}</Badge>
                </div>
                <Button variant="outline" onClick={handleReset}>Search Again</Button>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center gap-4">
                <User className="h-5 w-5 text-primary" />
                <div>
                    <p className="font-semibold">Customer Type</p>
                    <p className="text-muted-foreground capitalize">{selectedCar.customerType}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                    <p className="font-semibold">Entry Time</p>
                    <p className="text-muted-foreground">{formatTime(selectedCar.entryTimestamp)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Smartphone className="h-5 w-5 text-primary" />
                <div>
                    <p className="font-semibold">Customer Mobile</p>
                    <p className="text-muted-foreground">{selectedCar.customerMobileNumber}</p>
                </div>
              </div>
              <Button onClick={handleCheckout} disabled={isCheckingOut} className="w-full" size="lg">
                {isCheckingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Calculate Charges & Checkout
              </Button>
            </CardContent>
          </Card>
        )}
        
        <Dialog open={!!receiptData} onOpenChange={handleReceiptDialogClose}>
            <DialogContent className="w-[90vw] sm:max-w-lg rounded-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Receipt /> Payment Receipt</DialogTitle>
                    <DialogDescription>
                        Receipt for vehicle <span className="font-bold font-mono">{receiptData?.carNumber}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-sm">
                    <div className="flex items-center"><Hash className="mr-3 h-4 w-4 text-muted-foreground"/><strong>License Plate:</strong><span className="ml-auto font-mono">{receiptData?.carNumber}</span></div>
                    <div className="flex items-center"><Calendar className="mr-3 h-4 w-4 text-muted-foreground"/><strong>Entry:</strong><span className="ml-auto text-right">{formatTime(receiptData?.entryTime)}</span></div>
                    <div className="flex items-center"><Calendar className="mr-3 h-4 w-4 text-muted-foreground"/><strong>Exit:</strong><span className="ml-auto text-right">{formatTime(receiptData?.exitTime)}</span></div>
                    <div className="flex items-center"><Clock className="mr-3 h-4 w-4 text-muted-foreground"/><strong>Duration:</strong><span className="ml-auto">{receiptData?.parkingDuration}</span></div>
                    <div className="flex items-center text-lg font-bold"><strong>Total:</strong><span className="ml-auto">Rs {receiptData?.charges.toFixed(2)}</span></div>
                    {pdfUrl && (
                        <div className="flex items-center"><Link href={pdfUrl} className="text-sm text-primary hover:underline" target="_blank">View PDF Receipt</Link></div>
                    )}
                </div>
                {receiptData?.receipt && (
                <>
                    <Separator className="my-2"/>
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Generated Summary</p>
                        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                            {receiptData.receipt}
                        </div>
                    </div>
                </>
                )}
                <DialogFooter className="sm:justify-start pt-4">
                {receiptData && (
                    <Button 
                        asChild
                        className="w-full" 
                        size="lg"
                    >
                        <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                            `Here is your parking receipt:\n${window.location.origin}${pdfUrl}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                            <Smartphone className="mr-2 h-4 w-4"/> Share via WhatsApp
                        </a>
                    </Button>
                )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
     <LicensePlateScanner 
        isOpen={isScannerOpen}
        onOpenChange={setScannerOpen}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
}
