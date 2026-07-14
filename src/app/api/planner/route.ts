import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql, PlannerEntryDbRow } from "@/lib/neon";
import { cookies } from "next/headers";
import crypto from "crypto";

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
    SELECT * FROM planner_entries
    WHERE user_id = ${session.userId}
  `) as PlannerEntryDbRow[];

  return NextResponse.json({ data: rows });
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
    const body = await request.json();
    const { entries } = body;

    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: "Invalid payload format. Expected 'entries' array." }, { status: 400 });
    }

    // 1. Delete all existing entries for this user
    await sql`DELETE FROM planner_entries WHERE user_id = ${session.userId}`;

    // 2. Insert new entries
    for (const entry of entries) {
      if (!entry.date || !entry.recipe) continue;
      const id = crypto.randomUUID();
      await sql`
        INSERT INTO planner_entries (id, user_id, date, recipe)
        VALUES (${id}, ${session.userId}, ${entry.date}, ${JSON.stringify(entry.recipe)})
      `;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to save planner:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
