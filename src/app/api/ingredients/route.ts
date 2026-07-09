import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/neon";
import { cookies } from "next/headers";
import crypto from "crypto";

export interface ScannedIngredient {
  id: string;
  userId: string;
  ingredientName: string;
  scannedAt: string;
}

type IngredientRow = {
  id: string;
  user_id: string;
  ingredient_name: string;
  scanned_at: string;
};

function rowToIngredient(row: IngredientRow): ScannedIngredient {
  return {
    id: row.id,
    userId: row.user_id,
    ingredientName: row.ingredient_name,
    scannedAt: row.scanned_at,
  };
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ingredientName } = await request.json();

    if (!ingredientName) {
      return NextResponse.json({ error: "Ingredient name required" }, { status: 400 });
    }

    const existingRows = (await sql`
      SELECT * FROM ingredients
      WHERE user_id = ${session.userId} AND LOWER(ingredient_name) = LOWER(${ingredientName})
      LIMIT 1
    `) as IngredientRow[];

    if (existingRows[0]) {
      const updated = (await sql`
        UPDATE ingredients SET scanned_at = now()
        WHERE id = ${existingRows[0].id}
        RETURNING *
      `) as IngredientRow[];
      return NextResponse.json({ ingredient: rowToIngredient(updated[0]) });
    }

    const id = crypto.randomUUID();
    const inserted = (await sql`
      INSERT INTO ingredients (id, user_id, ingredient_name)
      VALUES (${id}, ${session.userId}, ${ingredientName})
      RETURNING *
    `) as IngredientRow[];

    return NextResponse.json({ ingredient: rowToIngredient(inserted[0]) });
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

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = (await sql`
    SELECT * FROM ingredients
    WHERE user_id = ${session.userId}
    ORDER BY scanned_at DESC
  `) as IngredientRow[];

  return NextResponse.json({ data: rows.map(rowToIngredient) });
}
