"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setTimeout(() => {
        setStatus("error");
        setErrorMessage("No session ID found in the URL.");
      }, 0);
      return;
    }

    const verifySession = async () => {
      try {
        const res = await fetch(`/api/billing/verify-session?session_id=${sessionId}`);
        if (res.ok) {
          setStatus("success");
        } else {
          const data = await res.json().catch(() => ({}));
          setStatus("error");
          setErrorMessage(data.error || "Failed to verify your payment.");
        }
      } catch (err: unknown) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "A network error occurred.");
      }
    };

    verifySession();
  }, [sessionId]);

  return (
    <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center p-8 text-center mx-auto mt-20">
      {status === "loading" && (
        <>
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full" />
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Verifying Payment...</h3>
          <p className="text-neutral-400 text-sm mb-6">
            Please wait while we confirm your transaction with Stripe.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
          <p className="text-neutral-400 text-sm mb-8">
            Your credits have been added to your account and your subscription is active.
          </p>
          <Link
            href="/budget"
            className="w-full py-4 rounded-xl font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-lg block text-center"
          >
            Start Generating Recipes
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Verification Failed</h3>
          <p className="text-neutral-400 text-sm mb-8">
            {errorMessage}
          </p>
          <button
            onClick={() => router.push("/billing")}
            className="w-full py-4 rounded-xl font-semibold text-white bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            Return to Billing
          </button>
        </>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-emerald-500/30 p-6">
      <Suspense fallback={
        <div className="flex items-center justify-center mt-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
