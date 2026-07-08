"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/account", label: "Account" },
  { href: "/pantry", label: "Pantry" },
  { href: "/budget", label: "Budget Meals" },
  { href: "/planner", label: "Planner" },
  { href: "/calculator", label: "Calculator" },
  { href: "/history", label: "History" },
];

export function MainNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-300">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between gap-3 sm:gap-4 px-4 py-3">
          {/* Brand Logo */}
          <Link href="/" className="shrink-0 transition-transform duration-300 hover:scale-105 active:scale-95">
            <div className="relative h-15 w-40 sm:h-22 sm:w-70 dark:drop-shadow-[0_0_15px_rgba(52,211,153,0.2)]">
              <Image
                src="/new_logo.png"
                alt="EZ Recipes Logo"
                fill
                className="object-contain object-left dark:brightness-110"
                priority
              />
            </div>
          </Link>

          {/* Right side: Hamburger + Theme Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all duration-300 hover:scale-110 active:scale-95"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X size={24} className="animate-spin" style={{ animationDuration: "0.3s" }} />
              ) : (
                <Menu size={24} className="animate-bounce" style={{ animationDuration: "2s" }} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Slides in from top */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-out mx-3 mt-3 rounded-2xl ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-b from-white/90 to-white/70 dark:from-slate-900/95 dark:to-slate-950/90 backdrop-blur-xl px-2 py-3 space-y-1.5 rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-slate-900/50">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 transform relative overflow-hidden ${
                  isActive
                    ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 scale-100"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:translate-x-1"
                }`}
                style={{
                  animation: isMenuOpen ? `slideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.08}s backwards` : "none",
                }}
              >
                {/* Animated background shine effect */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10 opacity-0 group-hover:opacity-100 transform -skew-x-12 group-hover:translate-x-full transition-all duration-500" />
                )}

                {/* Icon indicator for active state */}
                {isActive && (
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}

                <span className="relative z-10">{item.label}</span>

                {/* Hover indicator arrow */}
                {!isActive && (
                  <span className="ml-auto opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300 relative z-10">
                    →
                  </span>
                )}
              </Link>
            );
          })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  );
}
