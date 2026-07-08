// src/app/api/analyze-ingredient/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY!;

// Helper: retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      // Only retry on 503 / UNAVAILABLE errors
      const isUnavailable =
        (error && typeof error === 'object' && 'status' in error && error.status === 503) ||
        (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('UNAVAILABLE')) ||
        (error && typeof error === 'object' && 'error' in error && error.error && typeof error.error === 'object' && 'status' in error.error && error.error.status === 'UNAVAILABLE');

      if (attempt === maxRetries || !isUnavailable) {
        throw error; // give up or it's a different error
      }
      // Wait with exponential backoff: 1s, 2s, 4s...
      await new Promise(resolve => setTimeout(resolve, baseDelayMs * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error('Retry failed unexpectedly');
}

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    const ai = new GoogleGenAI({ apiKey });

    // Define the analysis function so we can retry it
    const analyze = async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // primary model (fastest)
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Identify this ingredient from the image. Return a JSON object with: name (string), calories (number per 100g), protein (grams), carbs (grams), fat (grams), typicalUses (string). Use standard values for the raw ingredient.' },
              { inlineData: { mimeType: 'image/jpeg', data: image.split(',')[1] } }
            ]
          }
        ],
        config: { temperature: 0.2 }
      });

      const text = response.text;
      if (!text) throw new Error('Empty response');
      // Extract JSON from the response (may be wrapped in markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      return JSON.parse(jsonMatch[0]);
    };

    let ingredient;
    try {
      ingredient = await retryWithBackoff(analyze, 3, 1000);
    } catch (primaryError) {
      // If the primary model keeps failing, try a fallback model
      const fallbackAnalyze = async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash', // more available, slightly slower
          contents: [
            {
              role: 'user',
              parts: [
                { text: 'Identify this ingredient from the image. Return a JSON object with: name (string), calories (number per 100g), protein (grams), carbs (grams), fat (grams), typicalUses (string). Use standard values for the raw ingredient.' },
                { inlineData: { mimeType: 'image/jpeg', data: image.split(',')[1] } }
              ]
            }
          ],
          config: { temperature: 0.2 }
        });
        const text = response.text;
        if (!text) throw new Error('Empty response');
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');
        return JSON.parse(jsonMatch[0]);
      };

      ingredient = await retryWithBackoff(fallbackAnalyze, 2, 2000);
    }

    return NextResponse.json({ ingredient });
  } catch (error: unknown) {
    console.error('Error analyzing ingredient:', error);
    return NextResponse.json(
      { error: 'The AI is temporarily overloaded. Please try again in a moment.' },
      { status: 503 }
    );
  }
}