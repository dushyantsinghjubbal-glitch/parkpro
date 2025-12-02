// All prices are in the smallest currency unit (e.g., paisa for INR)
// These are now fallback values. The primary source of pricing is Firestore.
export const HOURLY_RATE = 3000; // ₹30.00 per hour
export const DAILY_RATE = 10000; // ₹100.00 for > 8 hours
export const MONTHLY_RATE = 100000; // ₹1000.00 for monthly subscription
export const DAILY_RATE_HOURS_THRESHOLD = 8; // Hours after which daily rate applies
