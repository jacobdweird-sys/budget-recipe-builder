"use client";

import { useEffect, useMemo, useState } from "react";
import { MealPlan, SaleItem } from "@/types";
import { ShoppingList } from "@/components/shopping-list";
import { ShoppingCart, Lightbulb, Check } from "lucide-react";

const FOOD_CATEGORIES = [
  { id: "mexican", label: "Mexican" },
  { id: "italian", label: "Italian" },
  { id: "asian", label: "Asian" },
  { id: "mediterranean", label: "Mediterranean" },
  { id: "indian", label: "Indian" },
  { id: "american", label: "American" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "seafood", label: "Seafood" },
  { id: "comfort", label: "Comfort Food" },
];

export default function BudgetPage() {
  const [zipCode, setZipCode] = useState("");
  const [pantryItems, setPantryItems] = useState("");
  const [selectedFoodPrefs, setSelectedFoodPrefs] = useState<string[]>([]);
  const [recipeQuantity, setRecipeQuantity] = useState(3);
  const [budget, setBudget] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setToken("local_session");
          if (data.user.location) setZipCode(data.user.location);
          if (data.user.budgetGoal) setBudget(data.user.budgetGoal);
          if (data.user.dietaryPreferences && Array.isArray(data.user.dietaryPreferences)) {
            setSelectedFoodPrefs(data.user.dietaryPreferences);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("scannedIngredients");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPantryItems(parsed.join(", "));
        }
      } catch (_e) {
        // ignore
      }
    }
  }, []);

  const budgetSummary = useMemo(() => {
    if (!meals.length) return null;
    const avg = meals.reduce((sum, meal) => sum + meal.estimatedCostPerServing, 0) / meals.length;
    return avg.toFixed(2);
  }, [meals]);

  const toggleFoodPref = (id: string) => {
    setSelectedFoodPrefs((prev) =>
      prev.includes(id) ? prev.filter((pref) => pref !== id) : [...prev, id]
    );
  };

  async function generateBudgetRecipes() {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/budget-recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          zipCode,
          pantryItems: pantryItems
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          foodPreferences: selectedFoodPrefs.length > 0 ? selectedFoodPrefs : undefined,
          recipeQuantity,
          budget,
        }),
      });
      const data = await response.json();
      if (response.ok && data.meals) {
        setMeals(data.meals);
        setSales(data.sales ?? []);
        setSelectedMeal(null);
        setShowResultsModal(true);
        setErrorMessage("");
      } else {
        setErrorMessage(data.error || "Failed to generate meals. Please try again.");
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8 text-slate-900 dark:text-slate-200">
      <div className="flex flex-1 items-center justify-center w-full">
        {/* Input Form and Sales */}
        <div className="w-full max-w-lg flex flex-col gap-6">
          <section className="relative rounded-2xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] dark:shadow-inner transition-all duration-300 transform hover:shadow-[0_16px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_16px_40px_rgb(0,0,0,0.6)]">
            <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-white/40 to-transparent opacity-100 dark:opacity-10 pointer-events-none" />
            <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-primary-100/20 via-transparent to-primary-200/10 dark:from-primary-900/20 dark:to-primary-900/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <h1 className="relative z-10 text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent drop-shadow-sm">Budget Meals</h1>
            
            {/* ZIP Code */}
            <label className="relative z-10 mt-6 block text-sm font-bold text-slate-600 dark:text-slate-300">ZIP Code</label>
            <input 
              value={zipCode} 
              onChange={(event) => setZipCode(event.target.value)} 
              className="relative z-10 mt-2 w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-950/50 p-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)] outline-none focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all" 
              placeholder="94103" 
            />

            {/* Recipe Quantity */}
            <label className="relative z-10 mt-5 block text-sm font-bold text-slate-600 dark:text-slate-300">Number of Recipes</label>
            <div className="relative z-10 mt-2 flex items-center gap-4">
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={recipeQuantity}
                onChange={(e) => setRecipeQuantity(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full appearance-none cursor-pointer accent-primary-500"
              />
              <div className="relative bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-900/20 border-2 border-primary-300 dark:border-primary-700/50 rounded-lg px-4 py-2 min-w-[3rem] shadow-[0_4px_12px_rgba(16,185,129,0.15)] dark:shadow-[0_4px_12px_rgba(16,185,129,0.1)]">
                <p className="text-center font-extrabold text-primary-700 dark:text-primary-300">{recipeQuantity}</p>
              </div>
            </div>

            {/* Budget */}
            <label className="relative z-10 mt-5 block text-sm font-bold text-slate-600 dark:text-slate-300">Maximum Budget per Serving</label>
            <div className="relative z-10 mt-2 flex items-center gap-3">
              <span className="text-lg font-extrabold text-slate-700 dark:text-slate-300">$</span>
              <input 
                type="number" 
                min="5" 
                step="0.5"
                value={budget}
                onChange={(e) => setBudget(Math.max(5, parseFloat(e.target.value) || 5))}
                className="flex-1 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-950/50 p-3 text-sm font-bold text-slate-800 dark:text-slate-200 shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)] outline-none focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all"
              />
            </div>
            {budget < 5 && <p className="relative z-10 mt-1 text-xs font-medium text-red-600 dark:text-red-400">Budget must be at least $5</p>}

            {/* Food Preferences */}
            <label className="relative z-10 mt-6 block text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">Food Preferences (Optional)</label>
            <div className="relative z-10 grid grid-cols-2 gap-2">
              {FOOD_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleFoodPref(category.id)}
                  className={`relative px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 transform border-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${
                    selectedFoodPrefs.includes(category.id)
                      ? "bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-500 dark:to-primary-700 border-primary-600 dark:border-primary-800 text-white shadow-[0_8px_16px_rgba(16,185,129,0.3)] dark:shadow-[0_8px_16px_rgba(16,185,129,0.2)]"
                      : "bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Pantry Items Display */}
            <label className="relative z-10 mt-6 block text-sm font-bold text-slate-600 dark:text-slate-300">Scanned Pantry Items</label>
            <div className="relative z-10 mt-2 w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-950/50 p-3 text-sm text-slate-700 dark:text-slate-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] overflow-y-auto min-h-[4.5rem]">
              {pantryItems ? pantryItems : <span className="italic opacity-60">No ingredients scanned. Head to the Estimator to scan items!</span>}
            </div>

            {errorMessage && (
              <div className="relative z-10 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm font-medium text-center shadow-inner">
                {errorMessage}
              </div>
            )}

            {/* Generate Button */}
            <button 
              onClick={generateBudgetRecipes} 
              disabled={isGenerating || budget < 5}
              className="relative z-10 mt-6 w-full rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 px-4 py-3.5 text-sm font-extrabold text-white transition-all duration-300 hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] dark:hover:shadow-[0_12px_25px_rgba(16,185,129,0.25)] disabled:opacity-50 disabled:shadow-none shadow-[0_6px_20px_rgba(16,185,129,0.3)] dark:shadow-[0_6px_20px_rgba(16,185,129,0.15)] hover:-translate-y-1 active:translate-y-0 transform"
            >
              {isGenerating ? "Generating..." : `Generate ${recipeQuantity} Meals Under $${budget}`}
            </button>

            {budgetSummary ? (
              <div className="relative z-10 mt-5 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-900/20 border-2 border-primary-300 dark:border-primary-700/50 px-4 py-3 shadow-[0_8px_16px_rgba(16,185,129,0.1)] dark:shadow-[0_8px_16px_rgba(16,185,129,0.05)]">
                <p className="text-sm font-bold text-primary-700 dark:text-primary-300">Average cost per serving: <span className="text-lg">${budgetSummary}</span></p>
              </div>
            ) : null}
          </section>

          {sales.length ? (
            <section className="relative rounded-2xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] dark:shadow-inner transition-all duration-300 transform hover:shadow-[0_16px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_16px_40px_rgb(0,0,0,0.6)]">
              <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-white/40 to-transparent opacity-100 dark:opacity-10 pointer-events-none" />
              <h2 className="relative z-10 text-lg font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent drop-shadow-sm">Local Sales Snapshot</h2>
              <ul className="relative z-10 mt-4 space-y-2 text-sm">
                {sales.slice(0, 8).map((item) => (
                  <li key={item.id} className="border-b border-slate-200 dark:border-slate-700 pb-2 pt-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 px-2 rounded transition-colors">
                    <span className="font-bold text-slate-800 dark:text-primary-100">{item.name}</span>: <span className="font-medium text-slate-600 dark:text-slate-300">${item.salePrice}</span> <span className="text-slate-400 dark:text-slate-500">({item.unit})</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      {/* Pop Up Modal for Recipe Results */}
      {showResultsModal && meals.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-6 shadow-2xl">
            <button 
              onClick={() => setShowResultsModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              ✕
            </button>
            <div className="flex flex-col gap-6">
            <section className="relative rounded-2xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] dark:shadow-inner transition-all duration-300 transform hover:shadow-[0_16px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_16px_40px_rgb(0,0,0,0.6)]">
              <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-white/40 to-transparent opacity-100 dark:opacity-10 pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent drop-shadow-sm">
                  {selectedMeal ? selectedMeal.title : "Recipe Results"}
                </h2>
                <div className="flex gap-3">
                  {selectedMeal && (
                    <button
                      onClick={() => setSelectedMeal(null)}
                      className="rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                      Back to Options
                    </button>
                  )}
                  <button
                    onClick={() => setShowShoppingList(true)}
                    className="rounded-lg bg-gradient-to-br from-secondary-500 to-secondary-600 text-white px-4 py-2 text-sm font-bold hover:shadow-[0_8px_16px_rgba(244,168,35,0.3)] transition-shadow flex items-center gap-2"
                  >
                    <ShoppingCart size={18} />
                    Shopping List
                  </button>
                </div>
              </div>

              {selectedMeal ? (
                <div className="relative z-10 flex flex-col gap-6 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Cost and Time */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="inline-block rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/60 dark:to-primary-900/30 border-2 border-primary-300 dark:border-primary-700/50 px-4 py-2">
                          <p className="text-sm font-extrabold text-primary-800 dark:text-primary-300">${selectedMeal.estimatedCostPerServing}/serving</p>
                        </div>
                        {(selectedMeal.prepTime || selectedMeal.cookTime || selectedMeal.totalTime) && (
                          <div className="text-sm flex gap-2">
                            {selectedMeal.prepTime && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">Prep: {selectedMeal.prepTime}</span>}
                            {selectedMeal.cookTime && <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded">Cook: {selectedMeal.cookTime}</span>}
                            {selectedMeal.totalTime && <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">Total: {selectedMeal.totalTime}</span>}
                          </div>
                        )}
                      </div>

                      {/* Nutrition Facts */}
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="font-bold block mb-2 text-slate-700 dark:text-slate-300">Nutrition Facts (per serving):</span>
                        {selectedMeal.nutrition.calories} kcal • Protein {selectedMeal.nutrition.protein}g • Carbs {selectedMeal.nutrition.carbs}g • Fat {selectedMeal.nutrition.fat}g
                      </p>

                      {/* Ingredients */}
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">Ingredients</h4>
                        <ul className="space-y-2">
                          {(selectedMeal.detailedIngredients?.length ? selectedMeal.detailedIngredients : selectedMeal.ingredients.map(name => ({ name, amount: '', fromPantry: false }))).map((ingredient: {name: string, amount: string, fromPantry: boolean}, idx: number) => (
                            <li key={idx} className="flex items-center justify-between bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 px-3 py-2 rounded-lg shadow-sm">
                              <span className={`text-sm ${ingredient.fromPantry ? 'text-green-700 dark:text-green-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                                {ingredient.amount} {ingredient.name}
                              </span>
                              {ingredient.fromPantry && (
                                <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-2 py-1 rounded-md flex items-center gap-1">
                                  <Check size={12} /> Pantry
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {selectedMeal.suggestedSwaps && selectedMeal.suggestedSwaps.length > 0 && (
                        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb size={16} className="text-amber-600 dark:text-amber-400" />
                            <p className="font-bold text-amber-800 dark:text-amber-300">Ways to Save</p>
                          </div>
                          {selectedMeal.suggestedSwaps.map((swap, idx) => (
                            <div key={idx} className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                              Swap <span className="font-semibold">{swap.original}</span> for <span className="font-semibold">{swap.cheaper}</span> (Save {swap.saving})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">Instructions</h4>
                      <div className="space-y-3 bg-white dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        {(selectedMeal.detailedInstructions?.length ? selectedMeal.detailedInstructions : selectedMeal.instructions || []).map((instruction: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{instruction}</span>
                          </div>
                        ))}
                        {!(selectedMeal.detailedInstructions?.length) && !(selectedMeal.instructions?.length) && (
                           <p className="text-sm text-slate-500 italic">No instructions available for this recipe.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {meals.map((meal) => (
                    <article key={meal.id} className="group relative flex flex-col rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-800/60 dark:to-slate-800/40 p-5 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_12px_32px_rgba(16,185,129,0.2)] hover:border-primary-400 dark:hover:border-primary-500/50 hover:-translate-y-2 transform">
                      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-primary-50/0 to-primary-100/0 group-hover:from-primary-50/40 group-hover:to-primary-100/20 dark:group-hover:from-primary-900/20 dark:group-hover:to-primary-900/10 transition-all opacity-0 group-hover:opacity-100 pointer-events-none" />
                      <h3 className="relative z-10 text-lg font-extrabold text-slate-800 dark:text-primary-100 leading-tight mb-3 drop-shadow-sm">{meal.title}</h3>
                      
                      {/* Time Information */}
                      {(meal.prepTime || meal.cookTime || meal.totalTime) && (
                        <div className="relative z-10 mb-3 text-xs">
                          {meal.prepTime && <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded mr-2">Prep: {meal.prepTime}</span>}
                          {meal.cookTime && <span className="inline-block bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded mr-2">Cook: {meal.cookTime}</span>}
                          {meal.totalTime && <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">Total: {meal.totalTime}</span>}
                        </div>
                      )}

                      <div className="mt-auto space-y-3">
                        <div className="relative z-10 inline-block rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/60 dark:to-primary-900/30 border-2 border-primary-300 dark:border-primary-700/50 px-3 py-2 shadow-[0_4px_12px_rgba(16,185,129,0.15)] dark:shadow-[0_4px_12px_rgba(16,185,129,0.1)]">
                          <p className="text-sm font-extrabold text-primary-800 dark:text-primary-300">${meal.estimatedCostPerServing}/serving</p>
                        </div>
                        <p className="relative z-10 text-xs font-medium text-slate-600 dark:text-slate-400 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/50 dark:to-slate-900/30 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)]">
                          <span className="font-bold block mb-1.5 text-slate-700 dark:text-slate-300">Nutrition Facts:</span>
                          {meal.nutrition.calories} kcal • P {meal.nutrition.protein}g • C {meal.nutrition.carbs}g • F {meal.nutrition.fat}g
                        </p>
                        
                        <button
                          onClick={() => setSelectedMeal(meal)}
                          className="relative z-10 w-full mt-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white py-2.5 text-sm font-bold transition-colors shadow-sm"
                        >
                          Select Recipe
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            </div>
          </div>
        </div>
      )}

      {showShoppingList && (
        <ShoppingList
          meals={meals}
          pantryItems={pantryItems.split(",").map((item) => item.trim()).filter(Boolean)}
          onClose={() => setShowShoppingList(false)}
        />
      )}
    </main>
  );
}