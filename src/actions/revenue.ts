'use server';

import { initializeServerApp } from "@/firebase/server-init";
import { collection, getDocs } from "firebase/firestore";
import { calculateRevenueStats } from "@/lib/revenue-utils";

/**
 * Fetch all revenue records from Firestore
 * This MUST remain an async server action.
 */
export async function getRevenueData() {
  try {
    const { firestore } = initializeServerApp();
    const revenueRef = collection(firestore, "revenue");
    const snapshot = await getDocs(revenueRef);

    const records = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    return records;
  } catch (err) {
    console.error("Error fetching revenue:", err);
    return [];
  }
}

