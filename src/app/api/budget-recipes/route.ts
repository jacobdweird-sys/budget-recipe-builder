import { NextResponse } from "next/server";
import { z } from "zod";
import { keepBudgetMeals, priceRecipe } from "@/lib/mealMath";
import { getLocalSales } from "@/lib/sales";
import { MealPlan } from "@/types";
import { sql } from "@/lib/neon";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

const FOOD_CATEGORIES = [
  "mexican",
  "italian",
  "asian",
  "mediterranean",
  "indian",
  "american",
  "vegetarian",
  "vegan",
  "seafood",
  "comfort",
] as const;

const payloadSchema = z.object({
  zipCode: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().min(3).max(12).optional()
  ),
  pantryItems: z.array(z.string()).default([]),
  foodPreferences: z.array(z.string()).default([]),
  recipeQuantity: z.number().min(1).max(10).default(3),
  budget: z.number().min(5).max(100).default(15),
});

type SpoonacularRecipe = {
  id: number;
  title: string;
  image: string;
  sourceUrl: string;
  servings: number;
  extendedIngredients?: Array<{ original: string }>;
  analyzedInstructions?: Array<{ steps: Array<{ step: string }> }>;
  _enhanced?: {
    detailedIngredients?: Array<{name: string; amount: string; fromPantry: boolean}>;
    detailedInstructions?: string[];
    prepTime?: string;
    cookTime?: string;
    totalTime?: string;
    suggestedSwaps?: Array<{original: string; cheaper: string; saving: string}>;
  };
};

async function generateRecipesWithGemini(
  pantryItems: string[],
  foodPreferences: string[],
  recipeQuantity: number,
  budget: number
): Promise<SpoonacularRecipe[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("Gemini API key not found, using mock recipes");
    return generateMockRecipes(recipeQuantity);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const preferencesText = foodPreferences.length > 0 
      ? `User food preferences: ${foodPreferences.join(", ")}.` 
      : "";
    
    const pantryText = pantryItems.length > 0 
      ? `Available pantry items to use: ${pantryItems.join(", ")}.` 
      : "";

    const prompt = `Generate ${recipeQuantity} unique, budget-friendly recipes with a maximum cost of $${budget} per serving.

${preferencesText}
${pantryText}

Requirements:
- Each recipe should be realistic and achievable for home cooks
- MUST use ingredients from the user's pantry: ${pantryItems.join(", ")}
- Include 4-6 ingredients per recipe (prioritizing pantry items)
- Serve 4 people minimum
- Estimated cost per serving should be under $${budget}
- Include DETAILED step-by-step cooking instructions (6-8 specific steps)
- Each step should be clear, simple, and easy to follow
- Include cooking times and temperatures where appropriate
- Include approximate nutrition facts per serving (calories, protein, carbs, fat)
- For each recipe, suggest 1-2 ingredient substitutions (e.g., "swap salmon for canned tuna") that would reduce cost

Format your response as valid JSON array with this structure:
[
  {
    "title": "Recipe Name",
    "ingredients": [
      {"name": "ingredient 1", "amount": "1 cup", "fromPantry": true},
      {"name": "ingredient 2", "amount": "2 tbsp", "fromPantry": false}
    ],
    "servings": 4,
    "instructions": [
      "Step 1: Preheat oven to 375°F and prepare baking sheet",
      "Step 2: Chop vegetables into 1-inch pieces",
      "Step 3: Season with salt and pepper, toss with olive oil",
      "Step 4: Roast for 25-30 minutes until tender",
      "Step 5: Let cool for 5 minutes before serving"
    ],
    "estimatedCostPerServing": 3.50,
    "nutrition": {
      "calories": 450,
      "protein": 25,
      "carbs": 45,
      "fat": 12
    },
    "prepTime": "15 minutes",
    "cookTime": "30 minutes",
    "totalTime": "45 minutes",
    "suggestedSwaps": [
      {"original": "salmon", "cheaper": "canned tuna", "saving": "$2.50"}
    ]
  }
]

IMPORTANT:
- Make instructions very detailed and specific
- Include exact measurements and temperatures
- Mark which ingredients come from the user's pantry
- Steps should be numbered and easy to follow
- Include prep time, cook time, and total time
- suggestedSwaps should show realistic, money-saving ingredient substitutions with estimated savings (e.g., "$1.50")

Return ONLY the JSON array, no other text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse JSON from response
    const recipes = JSON.parse(responseText);
    
    // Convert to SpoonacularRecipe format with enhanced structure
    return recipes.map((recipe: {
      title: string;
      ingredients: Array<{name: string; amount: string; fromPantry: boolean}> | string[];
      instructions: string[];
      servings: number;
      estimatedCostPerServing: number;
      nutrition: {calories: number; protein: number; carbs: number; fat: number};
      prepTime?: string;
      cookTime?: string;
      totalTime?: string;
      suggestedSwaps?: Array<{original: string; cheaper: string; saving: string}>;
    }, index: number) => ({
      id: 5000 + index,
      title: recipe.title,
      image: `https://via.placeholder.com/556x370?text=${encodeURIComponent(recipe.title)}`,
      sourceUrl: "#",
      servings: recipe.servings || 4,
      extendedIngredients: Array.isArray(recipe.ingredients)
        ? recipe.ingredients.map((ing: unknown) => {
            if (typeof ing === 'string') {
              return { original: ing };
            }
            const ingredientObj = ing as {name: string; amount: string; fromPantry: boolean};
            return {
              original: `${ingredientObj.amount} ${ingredientObj.name}${ingredientObj.fromPantry ? ' (from pantry)' : ''}`
            };
          })
        : [],
      analyzedInstructions: [
        {
          steps: (Array.isArray(recipe.instructions) ? recipe.instructions : []).map((step: string) => ({ step })),
        },
      ],
      // Store enhanced data for later processing
      _enhanced: {
        detailedIngredients: Array.isArray(recipe.ingredients) && recipe.ingredients[0] && typeof recipe.ingredients[0] === 'object'
          ? recipe.ingredients as Array<{name: string; amount: string; fromPantry: boolean}>
          : (recipe.ingredients as string[]).map(ing => ({ name: ing, amount: 'to taste', fromPantry: pantryItems.includes(ing) })),
        detailedInstructions: recipe.instructions || [],
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        totalTime: recipe.totalTime,
        nutrition: recipe.nutrition,
        estimatedCostPerServing: recipe.estimatedCostPerServing,
        suggestedSwaps: recipe.suggestedSwaps || []
      }
    }));
  } catch (error) {
    console.error("Gemini API error:", error);
    return generateMockRecipes(recipeQuantity);
  }
}

function generateMockRecipes(quantity: number): SpoonacularRecipe[] {
  const mockRecipes = [
    {
      id: 1001,
      title: "Turkey Bean Skillet",
      image: "https://via.placeholder.com/556x370?text=Turkey+Bean+Skillet",
      sourceUrl: "#",
      servings: 4,
      extendedIngredients: ["ground turkey", "black beans", "onion", "garlic"].map((original) => ({
        original,
      })),
      analyzedInstructions: [
        {
          steps: [
            { step: "Heat a skillet over medium heat." },
            { step: "Add ground turkey and cook until browned." },
            { step: "Stir in black beans, onion, and garlic." },
            { step: "Cook for another 5 minutes and serve." },
          ],
        },
      ],
    },
    {
      id: 1002,
      title: "Egg Fried Rice",
      image: "https://via.placeholder.com/556x370?text=Egg+Fried+Rice",
      sourceUrl: "#",
      servings: 4,
      extendedIngredients: ["eggs", "brown rice", "spinach", "onion"].map((original) => ({ original })),
      analyzedInstructions: [
        {
          steps: [
            { step: "Scramble the eggs in a pan." },
            { step: "Add the brown rice, spinach, and onion." },
            { step: "Stir-fry until vegetables are tender." },
          ],
        },
      ],
    },
    {
      id: 1003,
      title: "Simple Pasta Bowl",
      image: "https://via.placeholder.com/556x370?text=Simple+Pasta+Bowl",
      sourceUrl: "#",
      servings: 4,
      extendedIngredients: ["pasta", "tomato sauce", "garlic", "spinach"].map((original) => ({ original })),
      analyzedInstructions: [
        {
          steps: [
            { step: "Boil the pasta according to package instructions." },
            { step: "Heat tomato sauce with garlic and spinach." },
            { step: "Toss pasta with the sauce and serve." },
          ],
        },
      ],
    },
    {
      id: 1004,
      title: "Chickpea Curry",
      image: "https://via.placeholder.com/556x370?text=Chickpea+Curry",
      sourceUrl: "#",
      servings: 4,
      extendedIngredients: ["chickpeas", "coconut milk", "onion", "curry powder", "rice"].map((original) => ({ original })),
      analyzedInstructions: [
        {
          steps: [
            { step: "Sauté onion in a pot." },
            { step: "Add curry powder and cook for 1 minute." },
            { step: "Add chickpeas and coconut milk." },
            { step: "Simmer for 15 minutes and serve over rice." },
          ],
        },
      ],
    },
    {
      id: 1005,
      title: "Vegetable Stir Fry",
      image: "https://via.placeholder.com/556x370?text=Vegetable+Stir+Fry",
      sourceUrl: "#",
      servings: 4,
      extendedIngredients: ["broccoli", "carrots", "soy sauce", "garlic", "rice"].map((original) => ({ original })),
      analyzedInstructions: [
        {
          steps: [
            { step: "Heat oil in a wok." },
            { step: "Add garlic and vegetables." },
            { step: "Stir-fry for 5-7 minutes." },
            { step: "Add soy sauce and serve over rice." },
          ],
        },
      ],
    },
    {
      id: 1006,
      title: "Bean Chili",
      image: "https://via.placeholder.com/556x370?text=Bean+Chili",
      sourceUrl: "#",
      servings: 4,
      extendedIngredients: ["beans", "tomato", "onion", "chili powder", "garlic"].map((original) => ({ original })),
      analyzedInstructions: [
        {
          steps: [
            { step: "Sauté onion and garlic." },
            { step: "Add beans and tomato." },
            { step: "Season with chili powder." },
            { step: "Simmer for 20 minutes." },
          ],
        },
      ],
    },
  ];

  return mockRecipes.slice(0, quantity);
}

async function fetchNutrition(ingredients: string[]) {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;
  if (!appId || !appKey) {
    return { calories: 420, protein: 24, fat: 13, carbs: 45 };
  }

  try {
    const response = await fetch(
      `https://api.edamam.com/api/nutrition-details?app_id=${appId}&app_key=${appKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Budget recipe",
          ingr: ingredients,
        }),
      }
    );

    if (!response.ok) {
      return { calories: 420, protein: 24, fat: 13, carbs: 45 };
    }

    const data = (await response.json()) as {
      calories?: number;
      totalNutrients?: {
        PROCNT?: { quantity?: number };
        FAT?: { quantity?: number };
        CHOCDF?: { quantity?: number };
      };
    };

    return {
      calories: Math.round(data.calories ?? 420),
      protein: Math.round(data.totalNutrients?.PROCNT?.quantity ?? 24),
      fat: Math.round(data.totalNutrients?.FAT?.quantity ?? 13),
      carbs: Math.round(data.totalNutrients?.CHOCDF?.quantity ?? 45),
    };
  } catch {
    return { calories: 420, protein: 24, fat: 13, carbs: 45 };
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  let userId: string | null = null;
  if (sessionId) {
    const session = await getSession(sessionId);
    if (session) userId = session.userId;
  }
  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const sales = await getLocalSales(parsed.data.zipCode);
  const recipes = await generateRecipesWithGemini(
    parsed.data.pantryItems,
    parsed.data.foodPreferences,
    parsed.data.recipeQuantity,
    parsed.data.budget
  );
  const mealCandidates: MealPlan[] = [];

  for (const recipe of recipes) {
    const ingredients = recipe.extendedIngredients?.map((item: {original: string}) => item.original) ?? [];
    if (!ingredients.length) {
      continue;
    }

    const priced = priceRecipe(ingredients, recipe.servings || 4, sales);
    const nutrition = await fetchNutrition(ingredients);

    mealCandidates.push({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      servings: recipe.servings,
      sourceUrl: recipe.sourceUrl,
      ingredients,
      estimatedTotalCost: priced.estimatedTotalCost,
      estimatedCostPerServing: priced.estimatedCostPerServing,
      nutrition,
      instructions: recipe.analyzedInstructions?.[0]?.steps?.map((s: {step: string}) => s.step) ?? [],
      // Enhanced recipe properties
      detailedIngredients: recipe._enhanced?.detailedIngredients || [],
      detailedInstructions: recipe._enhanced?.detailedInstructions || [],
      prepTime: recipe._enhanced?.prepTime,
      cookTime: recipe._enhanced?.cookTime,
      totalTime: recipe._enhanced?.totalTime,
      suggestedSwaps: recipe._enhanced?.suggestedSwaps || [],
    });
  }

  const meals = keepBudgetMeals(mealCandidates, parsed.data.recipeQuantity).filter(
    (meal) => meal.estimatedCostPerServing <= parsed.data.budget
  );

  if (userId) {
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO history (id, user_id, zip_code, pantry_items, food_preferences, budget, meals)
      VALUES (
        ${id},
        ${userId},
        ${parsed.data.zipCode ?? null},
        ${JSON.stringify(parsed.data.pantryItems)}::jsonb,
        ${JSON.stringify(parsed.data.foodPreferences ?? [])}::jsonb,
        ${parsed.data.budget},
        ${JSON.stringify(meals)}::jsonb
      )
    `;
  }

  return NextResponse.json({ meals, sales, availableCategories: FOOD_CATEGORIES });
}
