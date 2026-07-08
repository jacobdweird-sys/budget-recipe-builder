import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readJsonFile, writeJsonFile } from "@/lib/db";
import { cookies } from "next/headers";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const history = readJsonFile<Array<{id: string; user_id: string; generated_at: string}>>("history.json", []);
  
  const index = history.findIndex((h) => h.id === id && h.user_id === session.userId);
  if (index === -1) {
    return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
  }

  history.splice(index, 1);
  writeJsonFile("history.json", history);

  return NextResponse.json({ success: true });
}
