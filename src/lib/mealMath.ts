import { MealPlan, SaleItem } from "@/types";

const stopWords = new Set([
  "fresh",
  "organic",
  "large",
  "small",
  "medium",
  "chopped",
  "diced",
  "sliced",
  "minced",
  "optional",
  "to",
  "taste",
  "and",
]);

const ingredientSynonyms: Record<string, string[]> = {
  scallion: ["green onion", "spring onion"],
  cilantro: ["coriander"],
  chickpea: ["garbanzo", "garbanzo bean"],
  zucchini: ["courgette"],
  eggplant: ["aubergine"],
  bellpepper: ["capsicum", "sweet pepper"],
  ketchup: ["catsup"],
  arugula: ["rocket"],
  cornstarch: ["corn flour"],
  shrimp: ["prawn"],
  groundbeef: ["minced beef"],
  groundturkey: ["minced turkey"],
  tomato: ["roma tomato", "plum tomato"],
  blackbean: ["black beans"],
  kidneybean: ["kidney beans"],
  oats: ["oatmeal", "rolled oats"],
  yogurt: ["yoghurt"],
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.\s]/g, " ").replace(/\s+/g, " ").trim();
}

function singularize(token: string) {
  if (token.endsWith("es")) {
    return token.slice(0, -2);
  }
  if (token.endsWith("s")) {
    return token.slice(0, -1);
  }
  return token;
}

function tokenize(value: string) {
  return normalize(value)
    .split(" ")
    .map((token) => singularize(token))
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function compactToken(value: string) {
  return normalize(value).replace(/\s+/g, "");
}

function expandTokensWithSynonyms(tokens: string[]) {
  const expanded = new Set(tokens);

  for (const token of tokens) {
    const compact = compactToken(token);
    for (const [canonical, aliases] of Object.entries(ingredientSynonyms)) {
      if (compact === canonical || aliases.some((alias) => compact === compactToken(alias))) {
        expanded.add(canonical);
        for (const alias of aliases) {
          expanded.add(compactToken(alias));
          for (const aliasToken of tokenize(alias)) {
            expanded.add(aliasToken);
          }
        }
      }
    }
  }

  return [...expanded];
}

function inferQuantityMultiplier(ingredient: string) {
  const normalized = normalize(ingredient);
  const numberMatch = normalized.match(/(\d+(\.\d+)?)/);
  const amount = numberMatch ? Number(numberMatch[1]) : 1;

  if (normalized.includes("tbsp") || normalized.includes("tablespoon")) {
    return Math.max(0.1, amount * 0.08);
  }

  if (normalized.includes("tsp") || normalized.includes("teaspoon")) {
    return Math.max(0.05, amount * 0.03);
  }

  if (normalized.includes("oz")) {
    return Math.max(0.1, amount / 16);
  }

  if (normalized.includes("lb")) {
    return Math.max(0.2, amount);
  }

  if (normalized.includes("cup")) {
    return Math.max(0.15, amount * 0.25);
  }

  return Math.max(0.1, Math.min(1, amount));
}

function ingredientSimilarity(ingredient: string, saleItemName: string) {
  const ingredientTokens = expandTokensWithSynonyms(tokenize(ingredient));
  const saleTokens = expandTokensWithSynonyms(tokenize(saleItemName));

  if (!ingredientTokens.length || !saleTokens.length) {
    return 0;
  }

  const saleSet = new Set(saleTokens);
  const ingredientSet = new Set(ingredientTokens);
  const overlap = ingredientTokens.filter((token) => saleSet.has(token));
  const precision = overlap.length / ingredientSet.size;
  const recall = overlap.length / saleSet.size;
  const overlapScore = precision * 0.6 + recall * 0.4;
  const exactBoost =
    normalize(ingredient).includes(normalize(saleItemName)) || normalize(saleItemName).includes(normalize(ingredient)) ? 0.35 : 0;
  const synonymBoost = overlap.some((token) => token.length > 4) ? 0.1 : 0;

  return Math.min(1, overlapScore + exactBoost + synonymBoost);
}

function ingredientCost(ingredient: string, sales: SaleItem[]) {
  const quantityMultiplier = inferQuantityMultiplier(ingredient);
  let bestMatch: SaleItem | null = null;
  let bestScore = 0;

  for (const saleItem of sales) {
    const score = ingredientSimilarity(ingredient, saleItem.name);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = saleItem;
    }
  }

  const basePrice = bestScore >= 0.25 && bestMatch ? bestMatch.salePrice : 1.25;
  return basePrice * quantityMultiplier;
}

export function priceRecipe(ingredients: string[], servings: number, sales: SaleItem[]) {
  const total = ingredients.reduce((sum, ingredient) => sum + ingredientCost(ingredient, sales), 0);
  const safeServings = servings > 0 ? servings : 1;
  return {
    estimatedTotalCost: Number(total.toFixed(2)),
    estimatedCostPerServing: Number((total / safeServings).toFixed(2)),
  };
}

export function keepBudgetMeals(meals: MealPlan[], maxPerServing = 3) {
  return meals
    .filter((meal) => meal.estimatedCostPerServing <= maxPerServing)
    .sort((a, b) => a.estimatedCostPerServing - b.estimatedCostPerServing)
    .slice(0, 3);
}
