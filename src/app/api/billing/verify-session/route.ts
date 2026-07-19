import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, getUserById } from "@/lib/auth";
import { sql } from "@/lib/neon";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_123", {
  apiVersion: "2026-06-24.dahlia",
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userSessionId = cookieStore.get("session_id")?.value;
    if (!userSessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authSession = await getSession(userSessionId);
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserById(authSession.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    if (checkoutSession.client_reference_id !== user.id) {
      return NextResponse.json({ error: "Session belongs to a different user" }, { status: 403 });
    }

    // Check if we've already fulfilled this payment intent
    const paymentIntent = checkoutSession.payment_intent as Stripe.PaymentIntent;
    if (paymentIntent && paymentIntent.metadata?.fulfilled === "true") {
      // Already fulfilled
      return NextResponse.json({ success: true, message: "Already fulfilled" });
    }

    // Determine the plan and credits
    const plan = checkoutSession.metadata?.plan;
    let creditsToAdd = 0;
    let tierToSet = user.subscriptionTier;

    if (plan === "basic") {
      creditsToAdd = 100;
      tierToSet = "basic";
    } else if (plan === "pro") {
      creditsToAdd = 300;
      tierToSet = "pro";
    } else if (plan === "topup") {
      creditsToAdd = 50;
    }

    // Update database
    if (plan === "basic" || plan === "pro") {
      // Set new tier and replace credits
      await sql`
        UPDATE users 
        SET credits = ${creditsToAdd}, subscription_tier = ${tierToSet}
        WHERE id = ${user.id}
      `;
    } else if (plan === "topup") {
      // Add credits to existing
      await sql`
        UPDATE users 
        SET credits = COALESCE(credits, 100) + ${creditsToAdd}
        WHERE id = ${user.id}
      `;
    }

    // Mark payment intent as fulfilled to prevent double-crediting
    if (paymentIntent && paymentIntent.id) {
      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: { fulfilled: "true" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Stripe verify error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
