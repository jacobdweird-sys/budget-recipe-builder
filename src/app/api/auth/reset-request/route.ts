import { NextResponse } from "next/server";
import { sql } from "@/lib/neon";
import { getUserByEmail } from "@/lib/auth";
import crypto from "crypto";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    // Generic response to avoid email enumeration
    const genericResponse = {
      success: true,
      message: "If the email is registered, a verification code has been generated."
    };

    if (!user) {
      return NextResponse.json(genericResponse);
    }

    // Generate a secure 6-digit random token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Clean up any existing tokens for this email
    await sql`DELETE FROM reset_tokens WHERE email = ${email}`;

    // Store the new token
    await sql`
      INSERT INTO reset_tokens (id, email, token, expires_at)
      VALUES (${id}, ${email}, ${token}, ${expiresAt})
    `;

    // Simulate sending email by logging token to console
    console.log("==================================================");
    console.log(`[PASSWORD RESET TOKEN] Email: ${email} | Code: ${token}`);
    console.log("==================================================");

    // If running in development, return token in payload for easy UI testing
    const isDev = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_APP_URL?.includes("localhost");
    if (isDev) {
      return NextResponse.json({
        ...genericResponse,
        devToken: token
      });
    }

    return NextResponse.json(genericResponse);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
