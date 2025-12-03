'use server';

import { initializeServerApp } from "@/firebase/server-init";
import { collection, getDocs } from "firebase/firestore";

/**
 * Fetch all revenue records from Firestore
 */
export async function getRevenueData() {
  try {
    const { firestore } = initializeServerApp();
    const revenueRef = collection(firestore, "revenue");
    const snapshot = await getDocs(revenueRef);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    return data;
  } catch (e) {
    console.error("Error fetching revenue:", e);
    return [];
  }
}
export function calculateRevenueStats(records: any[]) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  let todayTotal = 0;
  let monthTotal = 0;
  let allTimeTotal = 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  for (const r of records) {
    const date = new Date(r.date);
    const isToday = r.date.startsWith(today);
    const isThisMonth =
      date.getMonth() === currentMonth && date.getFullYear() === currentYear;

    allTimeTotal += r.amount;

    if (isToday) todayTotal += r.amount;
    if (isThisMonth) monthTotal += r.amount;
  }

  return {
    todayTotal,
    monthTotal,
    allTimeTotal,
  };
}