import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readJsonFile } from "@/lib/db";
import { cookies } from "next/headers";

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

  const history = readJsonFile<Array<{user_id: string; generated_at: string}>>("history.json", []);
  const userHistory = history
    .filter((h) => h.user_id === session.userId)
    .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());

  return NextResponse.json({ data: userHistory });
}
