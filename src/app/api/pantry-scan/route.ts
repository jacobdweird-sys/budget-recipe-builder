import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Gemini API key not found, using static fallback ingredients");
      return NextResponse.json({
        ingredients: ["eggs", "spinach", "onion"],
        source: "fallback",
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Identify all raw ingredients, foodstuffs, vegetables, meats, and pantry items visible in this photo.
Return ONLY a valid JSON array of strings containing the lowercase names of the detected ingredients.
For example: ["eggs", "spinach", "onion", "butter", "milk"]
Do not return any markdown formatting (like \`\`\`json), comments, or surrounding text. Just the raw JSON array.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const responseText = result.response.text();
    // Strip markdown formatting if returned
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    let ingredients = JSON.parse(cleanedText);

    if (!Array.isArray(ingredients)) {
      console.warn("Gemini response is not an array:", cleanedText);
      ingredients = ["eggs", "spinach", "onion"];
    }

    return NextResponse.json({
      ingredients: ingredients.length ? ingredients : ["eggs", "spinach", "onion"],
      source: "gemini",
    });
  } catch (error) {
    console.error("Gemini Pantry Scan error:", error);
    return NextResponse.json({
      ingredients: ["eggs", "spinach", "onion"],
      source: "fallback",
    });
  }
}
