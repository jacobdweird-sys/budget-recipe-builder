import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required." }, { status: 400 });
  }

  const spoonacularKey = process.env.SPOONACULAR_API_KEY;
  if (!spoonacularKey) {
    return NextResponse.json({
      ingredients: ["eggs", "spinach", "onion"],
      source: "fallback",
    });
  }

  try {
    const upstreamForm = new FormData();
    upstreamForm.append("file", file);

    const response = await fetch(
      `https://api.spoonacular.com/food/images/analyze?apiKey=${spoonacularKey}`,
      {
        method: "POST",
        body: upstreamForm,
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        ingredients: ["eggs", "spinach", "onion"],
        source: "fallback",
      });
    }

    const data = (await response.json()) as {
      category?: { name?: string };
      nutrition?: { recipesUsed?: number };
      recipes?: Array<{ title: string }>;
    };

    const ingredients = data.recipes?.slice(0, 5).map((recipe) => recipe.title.toLowerCase()) ?? [];
    if (ingredients.length === 0 && data.category?.name) {
      ingredients.push(data.category.name.toLowerCase());
    }

    return NextResponse.json({
      ingredients: ingredients.length ? ingredients : ["eggs", "spinach", "onion"],
      source: "spoonacular",
    });
  } catch {
    return NextResponse.json({
      ingredients: ["eggs", "spinach", "onion"],
      source: "fallback",
    });
  }
}
