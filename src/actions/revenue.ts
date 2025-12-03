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
