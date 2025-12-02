# **App Name**: ParkPro

## Core Features:

- License Plate Scanning: Utilize the device's camera to automatically scan and recognize license plates using OCR technology.
- Customer Information Entry: Enable staff to manually enter customer mobile numbers associated with scanned license plates.
- Parking Data Storage: Store entry timestamp, license plate, mobile number and parking status ('parked', 'exited') in Firestore.
- Parked Time Tracking: Track and display the duration each car has been parked, calculated from the entry timestamp.
- Exit Scanning and Duration Calculation: Scan license plate upon exit, determine parking duration, and store exit timestamp in Firestore.
- Payment Receipt Generation: Generate a detailed payment receipt containing car number, entry time, exit time, duration, and calculated charges using AI pricing models tool.
- WhatsApp Sharing: Allow staff to instantly share formatted payment receipt with customers via WhatsApp using an automated API.

## Style Guidelines:

- Primary color: Dark blue (#3F51B5) to convey trust and professionalism.
- Background color: Light gray (#F5F5F5) for a clean and neutral backdrop.
- Accent color: Teal (#009688) for highlighting important actions and information. 
- Body and headline font: 'PT Sans' for a balance of modern style and readability.
- Simple, clear icons to represent parking status, time, and payment options.
- Intuitive layout optimized for quick data entry and scanning workflows.
- Subtle transitions for status updates and receipt generation.