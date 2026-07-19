import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, getUserById } from "@/lib/auth";
import Stripe from "stripe";


const PLAN_PRICES = {
  basic: { amount: 499, name: "Basic Plan - 100 Credits" },
  pro: { amount: 999, name: "Pro Plan - 300 Credits" },
  topup: { amount: 199, name: "Credit Top-Up - 50 Credits" },
};

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2026-06-24.dahlia",
  });

  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authSession = await getSession(sessionId);
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserById(authSession.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { plan } = body;

    if (!plan || !PLAN_PRICES[plan as keyof typeof PLAN_PRICES]) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const selectedPlan = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];

    // Create Checkout Sessions from body params.
    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        plan: plan,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: selectedPlan.name,
            },
            unit_amount: selectedPlan.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
