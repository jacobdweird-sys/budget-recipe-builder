"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GeneratedMealHistory, MealPlan } from "@/types";
import { Heart, Tag, X } from "lucide-react";

const RECIPE_TAGS = ["Breakfast", "Lunch", "Dinner", "Weeknight", "Weekend", "Quick", "Vegetarian", "Vegan", "Spicy"];

export default function HistoryPage() {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [entries, setEntries] = useState<GeneratedMealHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<{ historyId: string; recipeId: number } | null>(null);
  const [editingTags, setEditingTags] = useState<string[]>([]);

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
        if (!historyRes.ok) {
          throw new Error("Failed to load your meal history.");
        }
        const data = (await historyRes.json()) as { data: GeneratedMealHistory[] };
        setEntries(data.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function toggleFavorite(historyId: string, recipeId: number, currentFav: boolean) {
    try {
      const res = await fetch("/api/recipes/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          historyId,
          recipeId,
          isFavorite: !currentFav,
        }),
      });
      if (!res.ok) throw new Error("Failed to update favorite");

      const updatedEntries = entries.map(entry => {
        if (entry.id === historyId) {
          return {
            ...entry,
            meals: entry.meals.map(m =>
              m.id === recipeId ? { ...m, isFavorite: !currentFav } : m
            ),
          };
        }
        return entry;
      });
      setEntries(updatedEntries);
    } catch (err) {
      console.error(err);
    }
  }

  async function saveTags(historyId: string, recipeId: number) {
    try {
      const res = await fetch("/api/recipes/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          historyId,
          recipeId,
          tags: editingTags,
        }),
      });
      if (!res.ok) throw new Error("Failed to update tags");

      const updatedEntries = entries.map(entry => {
        if (entry.id === historyId) {
          return {
            ...entry,
            meals: entry.meals.map(m =>
              m.id === recipeId ? { ...m, tags: editingTags } : m
            ),
          };
        }
        return entry;
      });
      setEntries(updatedEntries);
      setEditingRecipe(null);
      setEditingTags([]);
    } catch (err) {
      console.error(err);
    }
  }

  const filteredEntries = entries
    .map(entry => ({
      ...entry,
      meals: entry.meals.filter(meal => {
        if (showFavoritesOnly && !meal.isFavorite) return false;
        if (selectedTag && !(meal.tags ?? []).includes(selectedTag)) return false;
        return true;
      }),
    }))
    .filter(entry => entry.meals.length > 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 text-slate-900 dark:text-slate-200">
      <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent drop-shadow-sm">
        Meal History
      </h1>

      {isLoading && (
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading your saved meal plans...</p>
      )}

      {!isLoading && isSignedIn === false && (
        <section className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Sign in to see the budget meal plans you&apos;ve generated.
          </p>
          <Link
            href="/account"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_6px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-transform"
          >
            Go to Account
          </Link>
        </section>
      )}

      {!isLoading && isSignedIn && entries.length === 0 && !error && (
        <section className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            No meal plans generated yet.
          </p>
          <Link
            href="/budget"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_6px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-transform"
          >
            Generate Budget Meals
          </Link>
        </section>
      )}

      {error && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
      )}

      {!isLoading && isSignedIn && entries.length > 0 && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 p-4">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all w-fit ${
                showFavoritesOnly
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Heart size={16} fill={showFavoritesOnly ? "currentColor" : "none"} />
              Favorites Only
            </button>

            {entries.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Filter by Tag:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      selectedTag === null
                        ? "bg-primary-600 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                    }`}
                  >
                    All
                  </button>
                  {RECIPE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        selectedTag === tag
                          ? "bg-primary-600 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Entries */}
          {filteredEntries.length === 0 ? (
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center py-8">
              No recipes match your filters.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {filteredEntries.map((entry) => (
                <section
                  key={entry.id}
                  className="relative rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      {new Date(entry.generated_at).toLocaleString()}
                    </h2>
                    <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest">
                      {entry.zip_code && (
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-slate-600 dark:text-slate-300">
                          ZIP {entry.zip_code}
                        </span>
                      )}
                      <span className="rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-primary-700 dark:text-primary-300">
                        Budget ${entry.budget}/serving
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {entry.meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-extrabold text-slate-800 dark:text-primary-100">{meal.title}</p>
                            <p className="mt-1 text-sm font-bold text-primary-700 dark:text-primary-300">
                              ${meal.estimatedCostPerServing}/serving
                            </p>
                          </div>
                          <button
                            onClick={() => toggleFavorite(entry.id, meal.id, meal.isFavorite ?? false)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Heart
                              size={18}
                              className={meal.isFavorite ? "text-red-500 fill-red-500" : "text-slate-400"}
                            />
                          </button>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {meal.nutrition.calories} kcal • P {meal.nutrition.protein}g • C {meal.nutrition.carbs}g • F {meal.nutrition.fat}g
                        </p>

                        {editingRecipe?.historyId === entry.id && editingRecipe?.recipeId === meal.id ? (
                          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex flex-wrap gap-2">
                              {RECIPE_TAGS.map(tag => (
                                <button
                                  key={tag}
                                  onClick={() => {
                                    if (editingTags.includes(tag)) {
                                      setEditingTags(editingTags.filter(t => t !== tag));
                                    } else {
                                      setEditingTags([...editingTags, tag]);
                                    }
                                  }}
                                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                                    editingTags.includes(tag)
                                      ? "bg-primary-600 text-white"
                                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveTags(entry.id, meal.id)}
                                className="flex-1 px-3 py-1 rounded-lg bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingRecipe(null)}
                                className="flex-1 px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {meal.tags && meal.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {meal.tags.map(tag => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold"
                                  >
                                    <Tag size={12} />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 dark:text-slate-500">No tags</p>
                            )}
                            <button
                              onClick={() => {
                                setEditingRecipe({ historyId: entry.id, recipeId: meal.id });
                                setEditingTags(meal.tags ?? []);
                              }}
                              className="mt-2 w-full px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            >
                              Edit Tags
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
