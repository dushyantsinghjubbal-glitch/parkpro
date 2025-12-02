'use server';

import { collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { initializeServerApp } from '@/firebase/server-init';
import type { Receipt } from '../types';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

export async function getRevenueData() {
  try {
    const { firestore } = initializeServerApp();
    const receiptsRef = collectionGroup(firestore, 'receipts');
    
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Fetch receipts for the current month
    const monthQuery = query(
        receiptsRef, 
        where('exitTimestamp', '>=', monthStart.toISOString()),
        where('exitTimestamp', '<=', monthEnd.toISOString())
    );
    
    const querySnapshot = await getDocs(monthQuery);
    const monthlyReceipts = querySnapshot.docs.map(doc => doc.data() as Receipt);
    
    let dailyRevenue = 0;
    let monthlyRevenue = 0;

    for (const receipt of monthlyReceipts) {
      const exitTime = new Date(receipt.exitTimestamp);
      monthlyRevenue += receipt.charges;
      if (exitTime >= todayStart && exitTime <= todayEnd) {
        dailyRevenue += receipt.charges;
      }
    }
    
    return { dailyRevenue, monthlyRevenue };

  } catch (error) {
    console.error("Error fetching revenue data:", error);
    // In case of error, return zero values to prevent breaking the dashboard.
    // A more robust solution might involve specific error handling on the client.
    return { dailyRevenue: 0, monthlyRevenue: 0 };
  }
}
