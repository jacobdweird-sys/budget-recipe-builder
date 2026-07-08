import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readJsonFile, writeJsonFile } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";

export interface ScannedIngredient {
  id: string;
  userId: string;
  ingredientName: string;
  scannedAt: string;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ingredientName } = await request.json();

    if (!ingredientName) {
      return NextResponse.json({ error: "Ingredient name required" }, { status: 400 });
    }

    const ingredients = readJsonFile<ScannedIngredient[]>("ingredients.json", []);
    
    // Prevent duplicates for the same user (or just update scannedAt)
    const existing = ingredients.find(
      (i) => i.userId === session.userId && i.ingredientName.toLowerCase() === ingredientName.toLowerCase()
    );

    if (existing) {
      existing.scannedAt = new Date().toISOString();
      writeJsonFile("ingredients.json", ingredients);
      return NextResponse.json({ ingredient: existing });
    }

    const newIngredient: ScannedIngredient = {
      id: crypto.randomUUID(),
      userId: session.userId,
      ingredientName,
      scannedAt: new Date().toISOString(),
    };

    ingredients.push(newIngredient);
    writeJsonFile("ingredients.json", ingredients);

    return NextResponse.json({ ingredient: newIngredient });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ingredients = readJsonFile<ScannedIngredient[]>("ingredients.json", []);
  const userIngredients = ingredients
    .filter((i) => i.userId === session.userId)
    .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());

  return NextResponse.json({ data: userIngredients });
}
