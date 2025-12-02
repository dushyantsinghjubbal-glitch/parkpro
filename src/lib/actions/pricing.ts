'use server';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeServerApp } from '@/firebase/server-init';
import type { PricingConfig } from '../types';

export async function getPricingConfig(): Promise<PricingConfig> {
    const { firestore } = initializeServerApp();
    const configDocRef = doc(firestore, 'app_config', 'pricing');
    const docSnap = await getDoc(configDocRef);

    if (docSnap.exists()) {
        return docSnap.data() as PricingConfig;
    } else {
        // If the document doesn't exist, create it with default values.
        console.log("Pricing config not found, creating with default values.");
        const defaultConfig: PricingConfig = {
            hourlyRate: 30,
            dailyRate: 100,
            monthlyRate: 1000,
            dailyRateHoursThreshold: 8,
        };
        // Use setDoc to create the document.
        await setDoc(configDocRef, defaultConfig);
        console.log("Default pricing config created in Firestore.");
        return defaultConfig;
    }
}
