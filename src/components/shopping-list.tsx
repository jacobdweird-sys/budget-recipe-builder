"use client";

import { MealPlan } from "@/types";
import { useState, useEffect } from "react";
import { ShoppingCart, Copy, Printer, X, Check, Lock } from "lucide-react";

interface ShoppingListProps {
  meals: MealPlan[];
  pantryItems?: string[];
  onClose: () => void;
}

interface ShoppingItem {
  name: string;
  amount: string;
  fromPantry: boolean;
  category: string;
}

const ITEM_CATEGORIES: { [key: string]: string } = {
  chicken: "Meat & Poultry",
  beef: "Meat & Poultry",
  pork: "Meat & Poultry",
  fish: "Meat & Poultry",
  salmon: "Meat & Poultry",
  tuna: "Meat & Poultry",
  turkey: "Meat & Poultry",
  shrimp: "Meat & Poultry",

  milk: "Dairy & Eggs",
  cheese: "Dairy & Eggs",
  yogurt: "Dairy & Eggs",
  butter: "Dairy & Eggs",
  egg: "Dairy & Eggs",
  cream: "Dairy & Eggs",

  tomato: "Produce",
  lettuce: "Produce",
  spinach: "Produce",
  carrot: "Produce",
  broccoli: "Produce",
  apple: "Produce",
  banana: "Produce",
  orange: "Produce",
  lemon: "Produce",
  lime: "Produce",
  garlic: "Produce",
  onion: "Produce",
  bellpepper: "Produce",
  potato: "Produce",
  cucumber: "Produce",

  bread: "Grains & Bread",
  rice: "Grains & Bread",
  pasta: "Grains & Bread",
  flour: "Grains & Bread",
  cereal: "Grains & Bread",
  oats: "Grains & Bread",

  olive: "Oils & Condiments",
  oil: "Oils & Condiments",
  salt: "Oils & Condiments",
  pepper: "Oils & Condiments",
  sauce: "Oils & Condiments",
  ketchup: "Oils & Condiments",
  mustard: "Oils & Condiments",
  vinegar: "Oils & Condiments",
};

function getCategoryForItem(item: string): string {
  const lowerItem = item.toLowerCase();
  for (const [keyword, category] of Object.entries(ITEM_CATEGORIES)) {
    if (lowerItem.includes(keyword)) {
      return category;
    }
  }
  return "Other";
}

export function ShoppingList({ meals, pantryItems = [], onClose }: ShoppingListProps) {
  const [showPantry, setShowPantry] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.user.subscriptionTier === "pro") {
          setIsPro(true);
        }
      })
      .catch(() => {});
  }, []);

  const pantrySet = new Set(
    pantryItems.map((item) => item.toLowerCase().trim())
  );

  const allItems: ShoppingItem[] = [];
  const itemMap = new Map<string, ShoppingItem>();

  for (const meal of meals) {
    const ingredients = meal.detailedIngredients || [];
    for (const ing of ingredients) {
      const key = `${ing.name.toLowerCase()}`;
      const inPantry = pantrySet.has(ing.name.toLowerCase());

      if (itemMap.has(key)) {
        const existing = itemMap.get(key)!;
        existing.amount = `${existing.amount} + ${ing.amount}`;
      } else {
        itemMap.set(key, {
          name: ing.name,
          amount: ing.amount,
          fromPantry: inPantry,
          category: getCategoryForItem(ing.name),
        });
      }
    }
  }

  const shoppingItems = Array.from(itemMap.values());
  const toShop = shoppingItems.filter((item) => !item.fromPantry);
  const alreadyHave = shoppingItems.filter((item) => item.fromPantry);

  const groupedByCategory = toShop.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as { [category: string]: ShoppingItem[] }
  );

  const categories = Object.keys(groupedByCategory).sort();

  function generateShoppingListText(): string {
    let text = "SHOPPING LIST\n";
    text += "=".repeat(40) + "\n\n";

    for (const category of categories) {
      text += `${category}\n`;
      text += "-".repeat(category.length) + "\n";
      for (const item of groupedByCategory[category]) {
        text += `[ ] ${item.amount} ${item.name}\n`;
      }
      text += "\n";
    }

    if (alreadyHave.length > 0) {
      text += "YOU ALREADY HAVE\n";
      text += "-".repeat(20) + "\n";
      for (const item of alreadyHave) {
        text += `[✓] ${item.amount} ${item.name}\n`;
      }
    }

    return text;
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(generateShoppingListText());
      alert("Shopping list copied to clipboard!");
    } catch {
      alert("Failed to copy. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-2xl w-full max-h-[90vh] rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-700 dark:to-primary-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={28} />
            <h2 className="text-2xl font-extrabold">Shopping List</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:text-slate-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Items to Shop */}
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mb-4">
              Items to Buy ({toShop.length})
            </h3>
            {categories.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">No items needed!</p>
            ) : (
              <div className="space-y-5">
                {categories.map((category) => (
                  <div key={category}>
                    <h4 className="text-sm font-bold text-primary-700 dark:text-primary-300 uppercase tracking-widest mb-3">
                      {category}
                    </h4>
                    <ul className="space-y-2">
                      {groupedByCategory[category].map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 group"
                        >
                          <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded flex items-center justify-center group-hover:border-primary-500 transition-colors">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-primary-600 rounded cursor-pointer"
                            />
                          </div>
                          <span className="text-slate-700 dark:text-slate-300">
                            <span className="font-medium">{item.amount}</span>{" "}
                            <span className="text-slate-600 dark:text-slate-400">
                              {item.name}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Already Have */}
          {alreadyHave.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Check size={16} className="text-primary-600 dark:text-primary-400" />
                <h3 className="text-sm font-bold text-primary-700 dark:text-primary-300 uppercase tracking-widest">
                  You Already Have ({alreadyHave.length})
                </h3>
              </div>
              <ul className="space-y-2">
                {alreadyHave.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-lg text-slate-500 dark:text-slate-400"
                  >
                    <Check size={16} className="text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    <span>
                      <span className="font-medium">{item.amount}</span> {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            {isPro ? (
              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold py-3 hover:shadow-[0_8px_16px_rgba(16,185,129,0.3)] transition-shadow flex items-center justify-center gap-2"
                >
                  <Copy size={18} />
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold py-3 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Print
                </button>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-center rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lock size={16} className="text-primary-600 dark:text-primary-400" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Pro Feature Locked
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Upgrade to Pro to unlock printing and copying to clipboard!
                </p>
                <a href="/billing" className="inline-block px-4 py-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors">
                  Upgrade Now
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
