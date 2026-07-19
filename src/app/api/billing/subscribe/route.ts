import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/neon';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    if (!plan || !['basic', 'pro', 'topup'].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    // Provision credits based on the plan
    let newTier = 'free';
    let addedCredits = 0;

    if (plan === 'basic') {
      newTier = 'basic';
      addedCredits = 100; // Reset to 100 for basic
    } else if (plan === 'pro') {
      newTier = 'pro';
      addedCredits = 300; // Reset to 300 for pro
    } else if (plan === 'topup') {
      addedCredits = 50;
    }

    // Execute the SQL update
    if (plan === 'topup') {
      await sql`
        UPDATE users 
        SET credits = COALESCE(credits, 100) + 50 
        WHERE id = ${session.userId}
      `;
    } else {
      await sql`
        UPDATE users 
        SET credits = ${addedCredits}, subscription_tier = ${newTier} 
        WHERE id = ${session.userId}
      `;
    }

    return NextResponse.json({ success: true, message: `Successfully provisioned ${plan} plan.` });

  } catch (error) {
    console.error("Billing error:", error);
    try {
      fs.writeFileSync(path.join(process.cwd(), 'billing-error.log'), String(error instanceof Error ? error.stack : error));
    } catch (e) {}
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
