import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (sessionId) {
    await deleteSession(sessionId);
    cookieStore.delete("session_id");
  }

  return NextResponse.json({ success: true });
}
