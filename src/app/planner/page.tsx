"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { MealPlan, GeneratedMealHistory } from "@/types";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

type PlannerDay = {
  date: string;
  dayName: string;
  recipe: MealPlan | null;
  servings: number;
};

export default function PlannerPage() {
  const [history, setHistory] = useState<GeneratedMealHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [planType, setPlanType] = useState<"week" | "month">("week");
  const [startDate, setStartDate] = useState(getToday());
  const [days, setDays] = useState<PlannerDay[]>([]);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = sessionRes.ok ? await sessionRes.json() : null;
        if (!sessionData?.user) {
          setIsSignedIn(false);
          setIsLoading(false);
          return;
        }
        setIsSignedIn(true);

        const historyRes = await fetch("/api/history");
        if (!historyRes.ok) throw new Error("Failed to load history");
        const data = (await historyRes.json()) as { data: GeneratedMealHistory[] };
        setHistory(data.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    generatePlan();
  }, [planType, startDate]);

  function getToday(): string {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  function generatePlan() {
    const numDays = planType === "week" ? 7 : 30;
    const start = new Date(startDate);
    const newDays: PlannerDay[] = [];

    for (let i = 0; i < numDays; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

      newDays.push({
        date: dateStr,
        dayName,
        recipe: null,
        servings: 1,
      });
    }
    setDays(newDays);
  }

  function updateServings(dayIndex: number, delta: number) {
    const newDays = [...days];
    const newServings = (newDays[dayIndex].servings || 1) + delta;
    if (newServings >= 1) {
      newDays[dayIndex].servings = newServings;
      setDays(newDays);
    }
  }

  function assignRecipeToDay(dayIndex: number, recipe: MealPlan) {
    const newDays = [...days];
    newDays[dayIndex].recipe = recipe;
    setDays(newDays);
  }

  function removeRecipeFromDay(dayIndex: number) {
    const newDays = [...days];
    newDays[dayIndex].recipe = null;
    setDays(newDays);
  }

  function changeStartDate(offset: number) {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + offset);
    setStartDate(newDate.toISOString().split("T")[0]);
  }

  const totalCost = useMemo(() => {
    return days
      .reduce((sum, day) => sum + (day.recipe?.estimatedCostPerServing ?? 0) * (day.servings ?? 1), 0)
      .toFixed(2);
  }, [days]);

  const allRecipes = useMemo(() => {
    const recipesMap = new Map<number, MealPlan>();
    history.forEach(entry => {
      (entry.meals ?? []).forEach(meal => {
        if (!recipesMap.has(meal.id)) {
          recipesMap.set(meal.id, meal);
        }
      });
    });
    return Array.from(recipesMap.values());
  }, [history]);

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 text-slate-900 dark:text-slate-200">
        <p className="text-slate-500 dark:text-slate-400">Loading meal planner...</p>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 text-slate-900 dark:text-slate-200">
        <h1 className="text-3xl font-extrabold">Meal Plan Calendar</h1>
        <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 p-8 text-center">
          <p className="mb-4 font-bold text-slate-600 dark:text-slate-300">
            Sign in to create and manage meal plans.
          </p>
          <Link
            href="/account"
            className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3 font-bold text-white hover:bg-primary-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 text-slate-900 dark:text-slate-200">
      <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent">
        Meal Plan Calendar
      </h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setPlanType("week")}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              planType === "week"
                ? "bg-primary-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            7-Day Week
          </button>
          <button
            onClick={() => setPlanType("month")}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              planType === "month"
                ? "bg-primary-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            30-Day Month
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => changeStartDate(-1)}
            className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-950/50 px-4 py-2 font-bold text-slate-800 dark:text-slate-200 focus:border-primary-500 outline-none"
          />
          <button
            onClick={() => changeStartDate(1)}
            className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-900/20 border-2 border-primary-200 dark:border-primary-700/50 px-4 py-2">
          <p className="text-xs font-bold text-primary-700 dark:text-primary-300">Total Cost:</p>
          <p className="text-xl font-extrabold text-primary-800 dark:text-primary-300">${totalCost}</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {days.map((day, idx) => (
          <div
            key={idx}
            className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 p-4 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-700 dark:text-slate-300">{day.dayName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{day.date}</p>
            </div>

            {day.recipe ? (
              <div className="space-y-2">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{day.recipe.title}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    ${day.recipe.estimatedCostPerServing} per serving
                  </p>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Servings:</span>
                  <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <button onClick={() => updateServings(idx, -1)} className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">-</button>
                    <span className="text-sm font-bold w-6 text-center">{day.servings}</span>
                    <button onClick={() => updateServings(idx, 1)} className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">+</button>
                  </div>
                  <span className="text-xs font-bold text-primary-600 ml-auto">${((day.recipe.estimatedCostPerServing ?? 0) * (day.servings ?? 1)).toFixed(2)}</span>
                </div>
                <button
                  onClick={() => removeRecipeFromDay(idx)}
                  className="w-full rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 text-sm font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const recipe = allRecipes[Math.floor(Math.random() * allRecipes.length)];
                    if (recipe) assignRecipeToDay(idx, recipe);
                  }}
                  disabled={allRecipes.length === 0}
                  className="w-full rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-3 py-2 text-sm font-bold hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                  Random
                </button>
                {allRecipes.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                      Choose Recipe
                    </summary>
                    <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                      {allRecipes.map((recipe) => (
                        <button
                          key={recipe.id}
                          onClick={() => assignRecipeToDay(idx, recipe)}
                          className="block w-full text-left px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          {recipe.title}
                        </button>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      {allRecipes.length > 0 && (
        <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 p-6">
          <h2 className="mb-4 text-xl font-extrabold text-slate-900 dark:text-white">
            Grocery Summary
          </h2>
          <div className="space-y-2">
            {days
              .filter((day) => day.recipe)
              .map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {day.date}: {day.recipe?.title}
                  </span>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    ${((day.recipe?.estimatedCostPerServing ?? 0) * (day.servings ?? 1)).toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </main>
  );
}
