'use client';

import { useState, useEffect } from 'react';
import type { ParkingRecord } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Car, Clock, ParkingCircleOff, Loader2, BellRing, User, DollarSign, TrendingUp, Landmark, Receipt } from 'lucide-react';
import { formatDistanceToNow, addDays, differenceInDays } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';
import { getRevenueData, calculateRevenueStats } from "@/actions/revenue";
import { Separator } from '../ui/separator';

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

function SubscriptionExpiry({ entryTime }: { entryTime: string }) {
    const [daysLeft, setDaysLeft] = useState(0);

    useEffect(() => {
        const entryDate = new Date(entryTime);
        const expiryDate = addDays(entryDate, 30);
        const remainingDays = differenceInDays(expiryDate, new Date());
        setDaysLeft(remainingDays);
    }, [entryTime]);

    if (daysLeft < 0) {
        return <span className="text-destructive font-medium">Expired</span>;
    }
    
    return <span className="font-medium">{daysLeft} day(s)</span>;
}

export function DashboardClient() {
  const firestore = useFirestore();

  const parkedCarsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'parking_records'), where('parkingStatus', '==', 'parked'));
  }, [firestore]);

  const { data: parkedCars, isLoading: isLoadingCars } = useCollection<ParkingRecord>(parkedCarsQuery);
  
  const [expiringSubscriptions, setExpiringSubscriptions] = useState<ParkingRecord[]>([]);

  const [revenueStats, setRevenueStats] = useState({ todayTotal: 0, monthTotal: 0, allTimeTotal: 0 });
  const [revenueRecords, setRevenueRecords] = useState<any[]>([]);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);

  useEffect(() => {
    async function fetchRevenue() {
      setIsLoadingRevenue(true);
      const records = await getRevenueData();
      const stats = calculateRevenueStats(records);
      const sortedRecords = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRevenueRecords(sortedRecords);
      setRevenueStats(stats);
      setIsLoadingRevenue(false);
    }
    fetchRevenue();
  }, []);

  useEffect(() => {
    if (parkedCars) {
      const now = new Date();
      const expiring = parkedCars.filter(car => {
        if (car.customerType !== 'monthly') return false;
        const entryDate = new Date(car.entryTimestamp);
        const expiryDate = addDays(entryDate, 30);
        const daysUntilExpiry = differenceInDays(expiryDate, now);
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 5;
      });
      setExpiringSubscriptions(expiring);
    }
  }, [parkedCars]);

  const monthlySubscribers = parkedCars?.filter(c => c.customerType === 'monthly').length ?? 0;
  const isLoading = isLoadingCars || isLoadingRevenue;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      <div className="xl:col-span-2 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Currently Parked</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoadingCars ? (
                    <Skeleton className="h-8 w-1/4" />
                ) : (
                    <div className="text-2xl font-bold">{parkedCars?.length ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground">Total cars in the facility</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Subscribers</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoadingCars ? (
                    <Skeleton className="h-8 w-1/4" />
                ) : (
                    <div className="text-2xl font-bold">{monthlySubscribers}</div>
                )}
                <p className="text-xs text-muted-foreground">Cars with monthly passes</p>
            </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoadingRevenue ? (
                        <Skeleton className="h-8 w-1/2" />
                    ) : (
                        <div className="text-2xl font-bold">Rs {revenueStats.todayTotal.toFixed(2)}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Revenue collected today</p>
                </CardContent>
            </Card>
        </Card>
        </div>

        {expiringSubscriptions.length > 0 && (
            <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary text-base md:text-lg">
                        <BellRing />
                        Upcoming Subscription Renewals
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>License Plate</TableHead>
                                    <TableHead>Expires In</TableHead>
                                    <TableHead>Entry Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expiringSubscriptions.map((car) => (
                                    <TableRow key={car.id}>
                                        <TableCell>
                                            <Badge variant="default" className="text-sm md:text-base font-semibold font-mono tracking-wider">{car.licensePlate}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <SubscriptionExpiry entryTime={car.entryTimestamp} />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <FormattedDate dateString={car.entryTimestamp} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        )}
        
        <Card>
            <CardHeader>
            <CardTitle>Active Parking Sessions</CardTitle>
            </CardHeader>
            <CardContent>
            {isLoadingCars ? (
                <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : parkedCars && parkedCars.length > 0 ? (
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
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
                </ScrollArea>
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <ParkingCircleOff className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-xl font-semibold">No Cars Parked</h3>
                <p className="text-muted-foreground">The parking lot is currently empty. Use the Car Entry page to check in a new car.</p>
                </div>
            )}
            </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Month&apos;s Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoadingRevenue ? (
                        <Skeleton className="h-8 w-1/2" />
                    ) : (
                        <div className="text-2xl font-bold">Rs {revenueStats.monthTotal.toFixed(2)}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Revenue for the current month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">All-Time Revenue</CardTitle>
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoadingRevenue ? (
                        <Skeleton className="h-8 w-1/2" />
                    ) : (
                        <div className="text-2xl font-bold">Rs {revenueStats.allTimeTotal.toFixed(2)}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Total revenue generated</p>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>The last 10 transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingRevenue ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : revenueRecords.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                        {revenueRecords.slice(0, 10).map((r) => (
                            <div key={r.id} className="flex items-center">
                                <Receipt className="h-5 w-5 text-muted-foreground mr-4" />
                                <div className="flex-1">
                                    <p className="font-medium font-mono">{r.carPlate}</p>
                                    <p className="text-sm text-muted-foreground">
                                        <FormattedDate dateString={r.date} />
                                    </p>
                                </div>
                                <div className="font-bold text-right">Rs {r.amount.toFixed(2)}</div>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No recent payments found.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
