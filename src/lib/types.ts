export type ParkingRecord = {
  id: string;
  licensePlate: string;
  customerMobileNumber: string;
  entryTimestamp: string; // ISO string
  exitTimestamp?: string; // ISO string
  parkingStatus: 'parked' | 'exited';
  receiptId?: string;
  customerType: 'regular' | 'monthly';
};

export type Receipt = {
  id: string;
  carNumber: string;
  entryTime: string; // ISO string
  exitTime: string; // ISO string
  duration: number; // in minutes
  charges: number;
  exitTimestamp: string; // ISO string
  pdfUrl?: string;
};

export type PricingConfig = {
    hourlyRate: number; // in smallest currency unit (e.g., paisa)
    dailyRate: number; // in smallest currency unit
    monthlyRate: number; // in smallest currency unit
    dailyRateHoursThreshold: number;
};

export type UserProfile = {
  id: string;
  email: string;
  role: 'admin' | 'staff';
};
