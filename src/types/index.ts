export type SaleItem = {
  id: string;
  name: string;
  store: string;
  unit: string;
  salePrice: number;
  regularPrice: number;
};

export type MealPlan = {
  id: number;
  title: string;
  image: string;
  servings: number;
  sourceUrl: string;
  ingredients: string[];
  estimatedTotalCost: number;
  estimatedCostPerServing: number;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  instructions?: string[];
  // Enhanced recipe properties
  detailedIngredients?: Array<{
    name: string;
    amount: string;
    fromPantry: boolean;
  }>;
  detailedInstructions?: string[];
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  // Ingredient substitution suggestions
  suggestedSwaps?: Array<{
    original: string;
    cheaper: string;
    saving: string;
  }>;
  // Favorites & tagging
  isFavorite?: boolean;
  tags?: string[];
};

export type GeneratedMealHistory = {
  id: string;
  generated_at: string;
  zip_code: string | null;
  pantry_items: string[];
  food_preferences: string[] | null;
  budget: number;
  meals: MealPlan[];
};

export type MealPlanDay = {
  date: string; // YYYY-MM-DD
  recipeId: number;
  recipeName: string;
  servings: number;
  cost: number;
};

export type SavedMealPlan = {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: MealPlanDay[];
  totalCost: number;
  createdAt: string;
  notes?: string;
};
