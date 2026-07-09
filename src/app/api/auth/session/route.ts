import { NextResponse } from "next/server";
import { getSession, getUserById } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ user: null });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ 
    user: { 
      id: user.id, 
      email: user.email,
      name: user.name,
      dietaryPreferences: user.dietaryPreferences,
      bio: user.bio,
      avatarEmoji: user.avatarEmoji,
      budgetGoal: user.budgetGoal,
      location: user.location,
    } 
  });
}
