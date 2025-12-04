
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { calculateCharges, calculateDuration } from './utils';
import { generatePaymentReceipt } from '@/ai/flows/generate-payment-receipt';
import { collection, getDocs, query, where, doc, runTransaction, setDoc } from 'firebase/firestore';
import { initializeServerApp } from '@/firebase/server-init';
import type { ParkingRecord, Receipt, PricingConfig } from './types';
import { v4 as uuidv4 } from 'uuid';
import { getPricingConfig } from './actions/pricing';

const ParkCarSchema = z.object({
  licensePlate: z.string().min(3, 'License plate must be at least 3 characters.'),
  customerMobile: z.string().min(10, 'Mobile number must be at least 10 digits.'),
  customerType: z.enum(['regular', 'monthly']),
});

const PricingConfigSchema = z.object({
  hourlyRate: z.coerce.number().positive('Hourly rate must be a positive number.'),
  dailyRate: z.coerce.number().positive('Daily rate must be a positive number.'),
  monthlyRate: z.coerce.number().positive('Monthly rate must be a positive number.'),
  dailyRateHoursThreshold: z.coerce.number().int().positive('Threshold must be a positive number.'),
});


export async function parkCar(prevState: any, formData: FormData) {
  const validatedFields = ParkCarSchema.safeParse({
    licensePlate: formData.get('licensePlate'),
    customerMobile: formData.get('customerMobile'),
    customerType: formData.get('customerType'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { firestore } = initializeServerApp();
    const parkingRecordsRef = collection(firestore, 'parking_records');

    const q = query(parkingRecordsRef, where('licensePlate', '==', validatedFields.data.licensePlate.toUpperCase()), where('parkingStatus', '==', 'parked'));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { error: { _form: ['CAR ALREADY PARKED. PLEASE EXIT FIRST'] } };
    }

    const newRecordId = uuidv4();
    const newRecord: ParkingRecord = {
      id: newRecordId,
      ...validatedFields.data,
      licensePlate: validatedFields.data.licensePlate.toUpperCase(),
      entryTimestamp: new Date().toISOString(),
      parkingStatus: 'parked',
      customerType: validatedFields.data.customerType,
    };

    const newDocRef = doc(firestore, 'parking_records', newRecordId);
    await setDoc(newDocRef, newRecord);

    revalidatePath('/dashboard');
    return { success: `Car ${validatedFields.data.licensePlate.toUpperCase()} parked successfully.` };

  } catch (e) {
    console.error("parkCar Error:", e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return { error: { _form: [errorMessage] } };
  }
}

export async function findCarByLicensePlate(licensePlate: string) {
  if (!licensePlate) return { error: 'License plate is required.' };

  try {
    const { firestore } = initializeServerApp();
    const parkingRecordsRef = collection(firestore, 'parking_records');
    
    const q = query(parkingRecordsRef, where('parkingStatus', '==', 'parked'));
    const querySnapshot = await getDocs(q);
    const allParkedCars = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParkingRecord));

    if (querySnapshot.empty) {
        return { error: 'There are no cars currently parked.' };
    }

    const normalizedSearchPlate = licensePlate.replace(/[\s-]/g, '').toUpperCase();

    const foundCars = allParkedCars.filter(car => {
        const normalizedCarPlate = car.licensePlate.replace(/[\s-]/g, '').toUpperCase();
        return normalizedCarPlate.includes(normalizedSearchPlate);
    });
  
    if (foundCars.length === 0) {
      return { error: 'No parked car found matching that license plate.' };
    }
    
    return { success: foundCars };
  } catch (e) {
    console.error("findCarByLicensePlate Error:", e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return { error: errorMessage };
  }
}

export async function checkoutCar(carId: string) {
  try {
    const { firestore } = initializeServerApp();
    const carDocRef = doc(firestore, 'parking_records', carId);
    
    let car: ParkingRecord | null = null;
    let receiptDataForFlow: any;
    let receiptId = uuidv4();
    let revenueId = uuidv4(); 

    const pricingConfig = await getPricingConfig();

    await runTransaction(firestore, async (transaction) => {
        const carDoc = await transaction.get(carDocRef);
        if (!carDoc.exists()) {
            throw new Error('Car not found.');
        }
        car = { id: carDoc.id, ...carDoc.data() } as ParkingRecord;

        const exitTimestamp = new Date().toISOString();
        const duration = calculateDuration(car.entryTimestamp, exitTimestamp);
        
        if (car.customerType === 'monthly' && duration.days < 30) {
            throw new Error("MONTHLY SUBSCRIPTION CAN'T EXIT");
        }
        
        const charges = calculateCharges(
            {hours: duration.hours, minutes: duration.minutes, days: duration.days},
            car.customerType,
            pricingConfig
        );
        
        receiptDataForFlow = {
            carNumber: car.licensePlate,
            entryTime: car.entryTimestamp,
            exitTime: exitTimestamp,
            parkingDuration: duration.formatted,
            charges: charges,
        };

        let receiptText = `Thank you for parking with us!\nCar: ${car.licensePlate}\nDuration: ${duration.formatted}\nTotal: Rs ${charges.toFixed(2)}`;

        if (process.env.GEMINI_API_KEY) {
          try {
            const result = await generatePaymentReceipt(receiptDataForFlow);
            receiptText = result.receipt;
          } catch(e) {
            console.error("AI receipt generation failed. Falling back to default text.", e);
          }
        }

        receiptDataForFlow.receipt = receiptText;

        const receiptRecord: Omit<Receipt, 'id'> = {
            carNumber: car.licensePlate,
            entryTime: car.entryTimestamp,
            exitTime: exitTimestamp,
            duration: duration.totalMinutes,
            charges: charges,
            exitTimestamp: exitTimestamp,
        };

        const receiptRef = doc(firestore, `parking_records/${carId}/receipts`, receiptId);
        transaction.set(receiptRef, { ...receiptRecord, id: receiptId });

        transaction.update(carDocRef, {
            parkingStatus: 'exited',
            exitTimestamp: exitTimestamp,
            receiptId: receiptId
        });

        const revenueRef = doc(firestore, 'revenue', revenueId);
        transaction.set(revenueRef, {
          id: revenueId,
          amount: charges,
          type: car!.customerType === 'monthly' ? 'monthly' : 'daily',
          date: exitTimestamp,
          carPlate: car!.licensePlate,
          receiptId: receiptId,
        });
    });

    revalidatePath('/dashboard');

    return { 
      success: { 
        ...receiptDataForFlow, 
        customerMobile: car!.customerMobileNumber,
        receiptId: receiptId,
        carId: car!.id
      } 
    };

  } catch (e) {
    console.error("Checkout Error: ", e);
    if (e instanceof Error) {
        return { error: e.message };
    }
    return { error: 'Checkout failed.' };
  }
}

export async function updatePricingConfig(prevState: any, formData: FormData) {
  const validatedFields = PricingConfigSchema.safeParse({
    hourlyRate: formData.get('hourlyRate'),
    dailyRate: formData.get('dailyRate'),
    monthlyRate: formData.get('monthlyRate'),
    dailyRateHoursThreshold: formData.get('dailyRateHoursThreshold'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { firestore } = initializeServerApp();
    const configDocRef = doc(firestore, 'app_config', 'pricing');
    
    const newConfig: PricingConfig = {
      hourlyRate: validatedFields.data.hourlyRate,
      dailyRate: validatedFields.data.dailyRate,
      monthlyRate: validatedFields.data.monthlyRate,
      dailyRateHoursThreshold: validatedFields.data.dailyRateHoursThreshold,
    };
    
    await setDoc(configDocRef, newConfig, { merge: true });

    revalidatePath('/settings');
    return { success: 'Pricing configuration updated successfully.' };

  } catch (e) {
    console.error("updatePricingConfig Error:", e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return { error: { _form: [errorMessage] } };
  }
}
