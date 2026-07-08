# Gemini AI Recipe Generation Setup Guide

## Overview
Your Budget Meals application now uses **Google's Gemini API** to generate AI-powered recipes based on user preferences, pantry items, and budget constraints.

## How to Get Free Gemini API Access

### Step 1: Get Your Free API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API key in new project"**
3. Select your project and click **"Create API key"**
4. Copy your API key (it will start with `AIza...`)

### Step 2: Check Your Environment Variables
Your `.env.local` file should already have:
```bash
GEMINI_API_KEY=AIzaSyB-kib9mFRD6RW8YaCfvvqQidZbZE9H-rY
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyB-kib9mFRD6RW8YaCfvvqQidZbZE9H-rY
```

### Step 3: Free Tier Limits
✅ **Free to use!** Google provides:
- 60 API calls per minute
- 1,500 API calls per day
- Completely free with no credit card required
- Perfect for development and small-scale applications

## How It Works

### Recipe Generation Flow
1. User selects:
   - Number of recipes (1-10)
   - Maximum budget per serving ($5-$100)
   - Food preferences (Mexican, Italian, Asian, etc.)
   - Pantry items they have available

2. **AI Processing**: 
   - Gemini generates customized recipes using `gemini-1.5-flash` model
   - Recipes include: ingredients, instructions, estimated costs, nutrition facts
   - All recipes respect the user's budget constraint

3. **Cost Calculation**:
   - Each ingredient is priced using local grocery sales data
   - Total cost per serving is calculated
   - Only recipes within budget are displayed

### Example Request to Gemini

The API sends a prompt like:
```
Generate 3 unique, budget-friendly recipes with a maximum cost of $8 per serving.

User food preferences: mexican, vegetarian.
Available pantry items to use: rice, beans, tomato, onion.

Requirements:
- Each recipe should be realistic and achievable
- Include 4-6 ingredients per recipe
- Serve 4 people minimum
- Estimated cost per serving should be under $8
- Include cooking instructions (2-4 steps)
- Include approximate nutrition facts per serving
```

## API Integration Details

### Location
- **File**: `/src/app/api/budget-recipes/route.ts`
- **Function**: `generateRecipesWithGemini()`
- **Model Used**: `gemini-1.5-flash` (fastest, most cost-effective)

### Key Features
✅ Falls back to mock recipes if API fails (no blank screens)
✅ Respects user budget constraints
✅ Personalizes recipes based on food preferences
✅ Integrates with existing nutrition/pricing calculations
✅ Error handling with helpful console logs

## Response Format

Gemini returns recipes in this JSON format:
```json
[
  {
    "title": "Budget Bean Tacos",
    "ingredients": ["tortillas", "beans", "tomato", "onion", "cheese"],
    "servings": 4,
    "instructions": [
      "Warm tortillas in a pan",
      "Heat beans with spices",
      "Assemble tacos with ingredients",
      "Serve warm with toppings"
    ],
    "estimatedCostPerServing": 3.50,
    "nutrition": {
      "calories": 450,
      "protein": 15,
      "carbs": 52,
      "fat": 14
    }
  }
]
```

## Troubleshooting

### "Gemini API key not found"
**Solution**: Add to `.env.local`:
```bash
GEMINI_API_KEY=your_api_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

### "API rate limit exceeded"
**Solution**: Wait a moment and try again. Free tier allows 60 calls/minute.

### Blank recipe results
**Solution**: Check browser console for errors. Mock recipes should load as fallback.

### Invalid JSON from Gemini
**Solution**: The API includes fallback mock recipes. This happens rarely with the latest Gemini models.

## Cost Estimates

### For Your Application
- **Development**: FREE (Google's generous free tier)
- **Small scale** (100 users/day): FREE
- **Medium scale** (1,000 users/day): FREE (within limits)
- **Production scaling**: Approx. $0.001 per request with paid tier

### Comparison with Other APIs
| API | Cost | Free Tier |
|-----|------|-----------|
| Claude (Anthropic) | $0.003/1K tokens | $5/month credit |
| OpenAI GPT-3.5 | $0.0005/1K tokens | $5 for 3 months |
| **Gemini** | **$0.00035/1K tokens** | **Free forever** |

## Next Steps

1. ✅ Test the app locally: `npm run dev`
2. ✅ Generate some recipes to verify it works
3. ✅ Monitor API usage in [Google AI Studio](https://aistudio.google.com/app/apikey)
4. ✅ Scale to production when ready

## Documentation Links
- [Google Generative AI Docs](https://ai.google.dev/)
- [Gemini API Reference](https://ai.google.dev/docs)
- [Rate Limits & Quotas](https://ai.google.dev/docs/quotas)
- [Best Practices](https://ai.google.dev/docs/best_practices)

---

**Your AI recipe generation is now live!** 🎉
