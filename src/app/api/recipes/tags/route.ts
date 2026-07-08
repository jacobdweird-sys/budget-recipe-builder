import { NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/db";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { historyId, recipeId, tags } = await request.json();

    const history = readJsonFile<Array<Record<string, unknown>>>("history.json", []);
    const entry = history.find(h => h.id === historyId && h.user_id === session.userId);

    if (!entry) {
      return NextResponse.json({ error: "History entry not found" }, { status: 404 });
    }

    const meals = entry.meals as Array<Record<string, unknown>>;
    const meal = meals.find(m => m.id === recipeId);

    if (!meal) {
      return NextResponse.json({ error: "Recipe not found in history" }, { status: 404 });
    }

    meal.tags = tags || [];
    writeJsonFile("history.json", history);

    return NextResponse.json({ success: true, meal });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
