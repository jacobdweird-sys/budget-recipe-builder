"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Zap, Shield, CreditCard, Star, ChevronRight, PackagePlus, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'basic' | 'pro' | 'topup' | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push("/account");
        } else {
          setIsLoadingAuth(false);
        }
      })
      .catch(() => {
        router.push("/account");
      });
  }, [router]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-neutral-400">Verifying session...</p>
      </div>
    );
  }

  const handleSubscribe = async (plan: 'basic' | 'pro' | 'topup') => {
    setIsRedirecting(plan);
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage(data.error || `HTTP error ${response.status}`);
        setIsRedirecting(null);
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Network error');
      setIsRedirecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-emerald-500/30">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <main className="relative container mx-auto px-6 py-20 lg:py-32 flex flex-col items-center">
        <div className="text-center max-w-3xl mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium tracking-wide">
            <Star className="w-4 h-4" />
            <span>Power Up Your Kitchen</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-400">
            Choose Your Credit Plan
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Every recipe generation costs 1 credit. Select a monthly plan that fits your meal prepping needs, or buy top-ups anytime.
          </p>
        </div>

        {/* Pricing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-neutral-400'}`}>Monthly</span>
          <button 
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative inline-flex h-7 w-14 items-center rounded-full bg-neutral-800 border border-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
          >
            <span className="sr-only">Toggle annual billing</span>
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-emerald-500 transition-transform ${isAnnual ? 'translate-x-8' : 'translate-x-1'}`}
            />
          </button>
          <span className={`text-sm font-medium flex items-center gap-2 ${isAnnual ? 'text-white' : 'text-neutral-400'}`}>
            Annually
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">Save 20%</span>
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl mb-12">
          {/* Basic Tier Card */}
          <div className="relative p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl flex flex-col hover:border-emerald-500/30 transition-colors">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-neutral-200 mb-2">Basic</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">
                  ${isAnnual ? '3.99' : '4.99'}
                </span>
                <span className="text-neutral-500">/ mo</span>
              </div>
              <p className="mt-4 text-emerald-400 font-bold text-lg">100 Credits</p>
              <p className="mt-2 text-neutral-400 text-sm">Perfect for casual weekly meal prepping.</p>
            </div>
            
            <ul className="space-y-4 flex-1 mb-8">
              {[
                "100 recipe generations per month",
                "Basic pantry scanning",
                "Standard budget estimations",
                "Save up to 20 favorite meals"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-5 h-5 text-neutral-600 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-auto pt-8 border-t border-neutral-800">
              <button 
                onClick={() => handleSubscribe('basic')}
                disabled={isRedirecting !== null}
                className="w-full py-4 rounded-xl font-semibold text-white bg-neutral-800 hover:bg-neutral-700 transition-colors border border-neutral-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRedirecting === 'basic' && <Loader2 className="w-5 h-5 animate-spin" />}
                {isRedirecting === 'basic' ? 'Redirecting...' : 'Subscribe to Basic'}
              </button>
            </div>
          </div>

          {/* Pro Tier Card */}
          <div className="relative p-8 rounded-3xl bg-gradient-to-b from-neutral-800 to-neutral-900 border border-emerald-500/50 shadow-2xl shadow-emerald-500/10 flex flex-col transform md:-translate-y-4 lg:col-span-1 md:col-span-1">
            {/* Glossy overlay */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/5 to-transparent opacity-50 pointer-events-none" />
            
            <div className="absolute -top-4 inset-x-0 flex justify-center">
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 text-xs font-bold uppercase tracking-wider shadow-lg">
                Most Popular
              </span>
            </div>

            <div className="relative mb-8 pt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-white">Pro</h3>
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-white">
                  ${isAnnual ? '7.99' : '9.99'}
                </span>
                <span className="text-neutral-400 font-medium">/ mo</span>
              </div>
              <p className="mt-4 text-emerald-400 font-bold text-xl">300 Credits</p>
              <p className="mt-2 text-emerald-400/80 text-sm font-medium">
                Ideal for families and daily inventory tracking.
              </p>
            </div>
            
            <ul className="relative space-y-4 flex-1 mb-8">
              {[
                "300 recipe generations per month",
                "Advanced multi-image pantry scanning",
                "Hyper-local grocery pricing integration",
                "Unlimited meal plans & history",
                "Export directly to Instacart/Walmart"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-neutral-100 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <div className="relative mt-auto pt-8 border-t border-neutral-700/50">
              <button 
                onClick={() => handleSubscribe('pro')}
                disabled={isRedirecting !== null}
                className="group relative w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-neutral-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all duration-300 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)] disabled:opacity-50"
              >
                {isRedirecting === 'pro' && <Loader2 className="w-5 h-5 animate-spin" />}
                <span>{isRedirecting === 'pro' ? 'Redirecting...' : 'Subscribe to Pro'}</span>
                {!isRedirecting && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </div>

          {/* Top Ups */}
          <div className="relative p-8 rounded-3xl bg-neutral-900/50 border border-neutral-800 backdrop-blur-xl flex flex-col md:col-span-2 lg:col-span-1 hover:border-purple-500/30 transition-colors">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-neutral-200">Credit Top-Up</h3>
                <PackagePlus className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$1.99</span>
                <span className="text-neutral-500">/ pack</span>
              </div>
              <p className="mt-4 text-purple-400 font-bold text-lg">50 Credits</p>
              <p className="mt-2 text-neutral-400 text-sm">Need a little extra? Buy credits on demand that never expire.</p>
            </div>
            
            <ul className="space-y-4 flex-1 mb-8">
              {[
                "Add 50 credits instantly",
                "No subscription required",
                "Credits rollover indefinitely",
                "Use for generating more recipes"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-5 h-5 text-neutral-600 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-auto pt-8 border-t border-neutral-800">
              <button 
                onClick={() => handleSubscribe('topup')}
                disabled={isRedirecting !== null}
                className="w-full py-4 rounded-xl font-semibold text-white bg-neutral-800 hover:bg-neutral-700 transition-colors border border-neutral-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRedirecting === 'topup' && <Loader2 className="w-5 h-5 animate-spin" />}
                {isRedirecting === 'topup' ? 'Redirecting...' : 'Buy 50 Credits'}
              </button>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center max-w-lg">
            {errorMessage}
          </div>
        )}

        {/* Secure checkout badges */}
        <div className="mt-12 flex flex-col items-center opacity-60">
          <p className="text-xs font-medium tracking-widest text-neutral-500 uppercase mb-4">Guaranteed Safe & Secure Checkout</p>
          <div className="flex items-center gap-6">
            <CreditCard className="w-8 h-8 text-neutral-400" />
            <Shield className="w-8 h-8 text-neutral-400" />
            <div className="h-6 flex items-center justify-center px-2 border border-neutral-700 rounded text-xs font-bold text-neutral-400">
              256-BIT SSL
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500">
            <Shield className="w-3 h-3" />
            <span>Secure payment powered by Stripe</span>
          </div>
        </div>
      </main>
    </div>
  );
}
