import { NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth";
import { sql } from "@/lib/neon";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { email, token, newPassword } = await request.json();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }

    if (!token || token.trim() === "") {
      return NextResponse.json({ error: "Verification token is required." }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Verify token exists and is not expired
    const tokenRows = await sql`
      SELECT * FROM reset_tokens 
      WHERE email = ${email} AND token = ${token} AND expires_at > now()
    `;

    if (tokenRows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired verification token." },
        { status: 400 }
      );
    }

    // Update password
    const user = await resetPassword(email, newPassword);
    if (!user) {
      return NextResponse.json({ error: "No account found for that email." }, { status: 400 });
    }

    // Clean up used token
    await sql`DELETE FROM reset_tokens WHERE email = ${email}`;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
