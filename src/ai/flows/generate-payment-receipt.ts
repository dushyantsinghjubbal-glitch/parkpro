'use server';

/**
 * @fileOverview Generates a detailed payment receipt for parking services.
 *
 * - generatePaymentReceipt - A function that generates a payment receipt.
 * - GeneratePaymentReceiptInput - The input type for the generatePaymentReceipt function.
 * - GeneratePaymentReceiptOutput - The return type for the generatePaymentReceipt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePaymentReceiptInputSchema = z.object({
  carNumber: z.string().describe('The license plate number of the car.'),
  entryTime: z.string().describe('The entry timestamp of the car (ISO format).'),
  exitTime: z.string().describe('The exit timestamp of the car (ISO format).'),
  parkingDuration: z.string().describe('The total parking duration (e.g., 2 hours 30 minutes).'),
  charges: z.number().describe('The calculated parking charges in currency format (e.g., 15.50).'),
});

export type GeneratePaymentReceiptInput = z.infer<typeof GeneratePaymentReceiptInputSchema>;

const GeneratePaymentReceiptOutputSchema = z.object({
  receipt: z.string().describe('A concise, friendly, one-line summary of the transaction.'),
});

export type GeneratePaymentReceiptOutput = z.infer<typeof GeneratePaymentReceiptOutputSchema>;

export async function generatePaymentReceipt(input: GeneratePaymentReceiptInput): Promise<GeneratePaymentReceiptOutput> {
  return generatePaymentReceiptFlow(input);
}

const generatePaymentReceiptPrompt = ai.definePrompt({
  name: 'generatePaymentReceiptPrompt',
  input: {schema: GeneratePaymentReceiptInputSchema},
  output: {schema: GeneratePaymentReceiptOutputSchema},
  prompt: `You are an AI assistant for a parking app. Generate a concise, friendly, one-line summary for a payment receipt.

  The user just paid {{charges}} for parking their car ({{carNumber}}) for {{parkingDuration}}.
  
  Generate a short, friendly message confirming the transaction. Example: "Your payment of Rs {{charges}} for {{parkingDuration}} was successful."`,
});

const generatePaymentReceiptFlow = ai.defineFlow(
  {
    name: 'generatePaymentReceiptFlow',
    inputSchema: GeneratePaymentReceiptInputSchema,
    outputSchema: GeneratePaymentReceiptOutputSchema,
  },
  async input => {
    const {output} = await generatePaymentReceiptPrompt(input);
    return output!;
  }
);
