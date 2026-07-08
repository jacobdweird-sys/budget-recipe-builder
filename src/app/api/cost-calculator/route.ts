import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenAI, Type } from "@google/genai";

const payloadSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1),
  servings: z.number().positive(),
  zipCode: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { ingredients, servings, zipCode } = parsed.data;
  
  let ingredientPrices: { name: string; price: number }[] = [];

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Mock fallback when no API key is provided
    ingredientPrices = ingredients.map((name) => ({
      name,
      price: Math.max(0.99, Number((name.length * 0.3 + 0.50).toFixed(2))), // Basic seeded mock
    }));
  } else {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Estimate the standard retail grocery store price in USD for buying standard recipe amounts of these ingredients: ${ingredients.join(", ")}. 

        ${zipCode ? 
          `Base the pricing on the local grocery stores and market rates for zip code ${zipCode}. Consider the cost of living and regional price variations for this specific location.` : 
          "Base the pricing on the United States average grocery store prices."
        }

        The recipe serves ${servings} people, so provide ingredient amounts that would be appropriate for this serving size. Consider standard package sizes and realistic quantities that would be purchased at a grocery store.

        Return realistic, current market prices that reflect what a consumer would actually pay at a typical grocery store in the specified location.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Name of the ingredient",
                },
                price: {
                  type: Type.NUMBER,
                  description: "Estimated price in USD for the amount needed for the recipe (e.g. 2.49)",
                },
              },
              required: ["name", "price"],
            },
          },
          temperature: 0.2,
        },
      });

      const text = response.text;
      if (text) {
        ingredientPrices = JSON.parse(text) as { name: string; price: number }[];
      } else {
        throw new Error("No text response from Gemini");
      }
    } catch (error) {
      console.error("Gemini failed, proceeding with fallback pricing:", error);
      ingredientPrices = ingredients.map((name) => ({
        name,
        price: Math.max(0.99, Number((name.length * 0.3 + 0.50).toFixed(2))),
      }));
    }
  }

  const totalCost = ingredientPrices.reduce((sum, item) => sum + Number(item.price), 0);
  const costPerServing = totalCost / servings;

  return NextResponse.json({
    ingredientPrices: ingredientPrices.map(item => ({ name: item.name, price: Number(item.price).toFixed(2) })),
    totalCost: totalCost.toFixed(2),
    costPerServing: costPerServing.toFixed(2),
  });
}
