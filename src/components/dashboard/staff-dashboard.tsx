'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, ParkingCircleOff, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { EntryDialog } from '@/components/entry/entry-dialog';
import { ExitDialog } from '@/components/exit/exit-dialog';
import { SidebarTrigger } from '../ui/sidebar';
import type { ParkingRecord } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

function CarTimer({ entryTime }: { entryTime: string | Date }) {
    const [duration, setDuration] = useState('');
  
    useEffect(() => {
      const updateDuration = () => {
        const date = typeof entryTime === 'string' ? new Date(entryTime) : entryTime;
        setDuration(formatDistanceToNow(date, { addSuffix: true }));
      };
  
      updateDuration();
      const interval = setInterval(updateDuration, 60000); // update every minute
      return () => clearInterval(interval);
    }, [entryTime]);
  
    return <span className="font-mono">{duration}</span>;
}

function FormattedDate({ dateString }: { dateString: string }) {
    const [formattedDate, setFormattedDate] = useState('');
  
    useEffect(() => {
        if (dateString) {
            setFormattedDate(new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            }));
        }
    }, [dateString]);
  
    if (!formattedDate) {
      return null;
    }
  
    return <>{formattedDate}</>;
}

export function StaffDashboard() {
  const [isEntryDialogOpen, setEntryDialogOpen] = useState(false);
  const [isExitDialogOpen, setExitDialogOpen] = useState(false);
  const firestore = useFirestore();

  const parkedCarsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'parking_records'), where('parkingStatus', '==', 'parked'));
  }, [firestore]);

  const { data: parkedCars, isLoading } = useCollection<ParkingRecord>(parkedCarsQuery);

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
        <div className="md:hidden">
            <SidebarTrigger />
        </div>
        <h1 className="text-lg font-semibold md:text-2xl">Staff Dashboard</h1>
      </header>
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
                variant="outline"
                className="h-24 text-lg"
                onClick={() => setEntryDialogOpen(true)}
            >
                Car Entry
            </Button>
            <Button
                className="h-24 text-lg"
                onClick={() => setExitDialogOpen(true)}
            >
                Car Exit
            </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Parking Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : parkedCars && parkedCars.length > 0 ? (
              <ScrollArea className="w-full whitespace-nowrap">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>License Plate</TableHead>
                        <TableHead>Parked Since</TableHead>
                        <TableHead>Duration</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {parkedCars.map((car) => (
                        <TableRow key={car.id}>
                        <TableCell>
                            <Badge variant="secondary" className="text-sm md:text-base font-semibold font-mono tracking-wider">{car.licensePlate}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                            <FormattedDate dateString={car.entryTimestamp} />
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <CarTimer entryTime={car.entryTimestamp} />
                            </div>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                <div className="h-4"></div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <ParkingCircleOff className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-xl font-semibold">No Cars Parked</h3>
                <p className="text-muted-foreground">The parking lot is currently empty.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <EntryDialog isOpen={isEntryDialogOpen} onOpenChange={setEntryDialogOpen} />
      <ExitDialog isOpen={isExitDialogOpen} onOpenChange={setExitDialogOpen} />
    </>
  );
}
