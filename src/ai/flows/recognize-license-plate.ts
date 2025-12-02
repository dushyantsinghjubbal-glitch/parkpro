'use server';

/**
 * @fileOverview Recognizes a license plate from an image.
 *
 * - recognizeLicensePlate - A function that handles the license plate recognition.
 * - RecognizeLicensePlateInput - The input type for the recognizeLicensePlate function.
 * - RecognizeLicensePlateOutput - The return type for the recognizeLicensePlate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecognizeLicensePlateInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image of a car's license plate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeLicensePlateInput = z.infer<typeof RecognizeLicensePlateInputSchema>;

const RecognizeLicensePlateOutputSchema = z.object({
  licensePlate: z.string().describe('The recognized license plate number.'),
});
export type RecognizeLicensePlateOutput = z.infer<typeof RecognizeLicensePlateOutputSchema>;

export async function recognizeLicensePlate(input: RecognizeLicensePlateInput): Promise<RecognizeLicensePlateOutput> {
  return recognizeLicensePlateFlow(input);
}

const recognizeLicensePlatePrompt = ai.definePrompt({
  name: 'recognizeLicensePlatePrompt',
  input: {schema: RecognizeLicensePlateInputSchema},
  output: {schema: RecognizeLicensePlateOutputSchema},
  prompt: `You are an OCR model specialized in recognizing license plates. 
  Extract the license plate number from the following image.
  Return only the license plate number as a single, continuous string.
  
  Image: {{media url=imageDataUri}}`,
});

const recognizeLicensePlateFlow = ai.defineFlow(
  {
    name: 'recognizeLicensePlateFlow',
    inputSchema: RecognizeLicensePlateInputSchema,
    outputSchema: RecognizeLicensePlateOutputSchema,
  },
  async input => {
    const {output} = await recognizeLicensePlatePrompt(input);
    return output!;
  }
);
