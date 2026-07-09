import { NextResponse } from "next/server";
import { getSession, updateUserProfile } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PUT(request: Request) {
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
    const formData = await request.formData();
    const name = formData.get("name") as string | null;
    const bio = formData.get("bio") as string | null;
    const location = formData.get("location") as string | null;
    const budgetGoalStr = formData.get("budgetGoal") as string | null;
    const dietaryPrefsStr = formData.get("dietaryPreferences") as string | null;

    let dietaryPreferences: string[] | undefined;
    try {
      dietaryPreferences = dietaryPrefsStr ? JSON.parse(dietaryPrefsStr) : undefined;
    } catch {
      dietaryPreferences = undefined;
    }

    const budgetGoal = budgetGoalStr && budgetGoalStr.trim() ? Number(budgetGoalStr) : undefined;

    const updatedUser = await updateUserProfile(session.userId, {
      name: name || undefined,
      dietaryPreferences,
      bio: bio || undefined,
      budgetGoal,
      location: location || undefined,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        dietaryPreferences: updatedUser.dietaryPreferences,
        bio: updatedUser.bio,
        avatarEmoji: updatedUser.avatarEmoji,
        budgetGoal: updatedUser.budgetGoal,
        location: updatedUser.location,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
