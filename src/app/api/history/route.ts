import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/neon";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = (await sql`
    SELECT id, zip_code, pantry_items, food_preferences, budget, meals, generated_at
    FROM history
    WHERE user_id = ${session.userId}
    ORDER BY generated_at DESC
  `) as Array<{
    id: string;
    zip_code: string | null;
    pantry_items: string[];
    food_preferences: string[] | null;
    budget: string;
    meals: unknown[];
    generated_at: string;
  }>;

  const userHistory = rows.map((r) => ({
    id: r.id,
    generated_at: r.generated_at,
    zip_code: r.zip_code,
    pantry_items: r.pantry_items,
    food_preferences: r.food_preferences,
    budget: Number(r.budget),
    meals: r.meals,
  }));

  return NextResponse.json({ data: userHistory });
}
