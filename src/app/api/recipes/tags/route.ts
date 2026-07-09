import { NextResponse } from "next/server";
import { sql } from "@/lib/neon";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { historyId, recipeId, tags } = await request.json();

    const rows = (await sql`
      SELECT id, meals FROM history WHERE id = ${historyId} AND user_id = ${session.userId}
    `) as Array<{ id: string; meals: Array<Record<string, unknown>> }>;

    const entry = rows[0];
    if (!entry) {
      return NextResponse.json({ error: "History entry not found" }, { status: 404 });
    }

    const meals = entry.meals;
    const meal = meals.find((m) => m.id === recipeId);
    if (!meal) {
      return NextResponse.json({ error: "Recipe not found in history" }, { status: 404 });
    }

    meal.tags = tags || [];

    await sql`
      UPDATE history SET meals = ${JSON.stringify(meals)}::jsonb WHERE id = ${historyId}
    `;

    return NextResponse.json({ success: true, meal });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
