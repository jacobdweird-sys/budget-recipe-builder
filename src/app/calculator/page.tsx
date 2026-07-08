"use client";

import { useState, useMemo, ChangeEvent, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";

type AIPriceItem = {
  name: string;
  price: string;
};

type ScannedIngredient = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  typicalUses: string;
};

export default function CalculatorPage() {
  const [servingsInput, setServingsInput] = useState("4");
  const [zipCode, setZipCode] = useState("");
  const [ingredientPrices, setIngredientPrices] = useState<AIPriceItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorStatus, setErrorStatus] = useState("");
  
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [ingredients, setIngredients] = useState<ScannedIngredient[]>([]);
  const [status, setStatus] = useState("");
  const [isCameraMode, setIsCameraMode] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const parsedServings = useMemo(() => {
    const s = Number(servingsInput);
    return Number.isNaN(s) || s <= 0 ? 1 : s;
  }, [servingsInput]);

  useEffect(() => {
    if (ingredients.length > 0) {
      localStorage.setItem("scannedIngredients", JSON.stringify(ingredients.map(ing => ing.name)));
    }
  }, [ingredients]);

  const totalCost = useMemo(() => {
    return ingredientPrices.reduce((sum, item) => sum + Number(item.price), 0);
  }, [ingredientPrices]);

  const costPerServing = useMemo(() => {
    return totalCost / parsedServings;
  }, [totalCost, parsedServings]);

  function onUploadChange(event: ChangeEvent<HTMLInputElement>) {
    setScanFile(event.target.files?.[0] ?? null);
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const processImage = async (base64Image: string) => {
    setStatus("Analyzing ingredient...");
    try {
      const response = await fetch("/api/analyze-ingredient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await response.json();
      if (data.error) {
        setStatus(data.error);
        return;
      }

      if (data.ingredient) {
        const newIngredient: ScannedIngredient = {
          id: crypto.randomUUID(),
          ...data.ingredient,
        };
        setIngredients(prev => [...prev, newIngredient]);
        setStatus(`Successfully scanned: ${data.ingredient.name}`);
        
        // Save to server for logged-in users
        try {
          await fetch("/api/ingredients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ingredientName: data.ingredient.name }),
          });
        } catch (_e) {
          // silently ignore if not logged in or network error
        }
      }
    } catch (error) {
      console.error(error);
      setStatus("Failed to analyze image.");
    }
  };

  const captureCamera = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      processImage(imageSrc);
    } else {
      setStatus("Failed to capture image from camera.");
    }
  }, [webcamRef]);

  async function scanPantryImage() {
    if (!scanFile) {
      setStatus("Please select an image first.");
      return;
    }
    const base64Image = await fileToBase64(scanFile);
    processImage(base64Image);
  }

  function removeIngredient(idToRemove: string) {
    setIngredients(prev => prev.filter(ing => ing.id !== idToRemove));
  }

  async function estimateCosts() {
    const ingredientsNames = ingredients.map(ing => ing.name);
    if (!ingredientsNames.length) {
      setErrorStatus("Please scan at least one ingredient.");
      return;
    }
    
    setErrorStatus("");
    setIsGenerating(true);
    try {
      const response = await fetch("/api/cost-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientsNames, servings: parsedServings, zipCode }),
      });
      const data = (await response.json()) as { ingredientPrices?: AIPriceItem[]; error?: string };
      
      if (data.error) {
        setErrorStatus(data.error);
        return;
      }
      if (data.ingredientPrices) {
        setIngredientPrices(data.ingredientPrices);
      }
    } catch {
      setErrorStatus("Failed to communicate with cost server.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 text-slate-900 dark:text-slate-200">
      
      <div className="text-center md:text-left mb-2 px-2 relative z-10">
         <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary-600 dark:text-primary-400 drop-shadow-sm">AI Cost Estimator</h1>
         <p className="mt-2 text-sm md:text-base text-slate-600 dark:text-slate-400">Instantly generate standard grocery prices based on your location using AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start w-full">
        {/* Left Column: Form Controls */}
        <div className="md:col-span-5 lg:col-span-5 flex flex-col gap-6">
          <section className="relative rounded-[2rem] border border-white/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] dark:shadow-inner backdrop-blur-xl transition-all duration-300">
            <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-white/40 to-transparent opacity-100 dark:opacity-10 pointer-events-none" />
            <h2 className="relative z-10 text-xl font-extrabold text-primary-600 dark:text-primary-400 mb-4 drop-shadow-sm">Scan Ingredients</h2>

            {/* Toggle Mode */}
            <div className="relative z-10 flex rounded-xl bg-slate-100/80 dark:bg-slate-950/50 p-1 mb-4 border border-slate-200 dark:border-slate-800 shadow-inner">
              <button
                className={`flex-1 rounded-lg py-1.5 text-sm font-bold transition-all duration-300 ${!isCameraMode ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-300 shadow-sm dark:shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400'}`}
                onClick={() => setIsCameraMode(false)}
              >
                Upload Photo
              </button>
              <button
                className={`flex-1 rounded-lg py-1.5 text-sm font-bold transition-all duration-300 ${isCameraMode ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-300 shadow-sm dark:shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400'}`}
                onClick={() => setIsCameraMode(true)}
              >
                Use Camera
              </button>
            </div>
            
            {isCameraMode ? (
              <div className="relative z-10 flex flex-col gap-3">
                <div className="overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-black aspect-square flex items-center justify-center relative shadow-inner">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button onClick={captureCamera} className="w-full rounded-xl bg-primary-500 dark:bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-primary-400 dark:hover:bg-primary-500 shadow-[0_4px_15px_rgba(16,185,129,0.3)] dark:shadow-inner hover:-translate-y-0.5 active:translate-y-0">
                  Capture Ingredient
                </button>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col gap-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Upload an image of an ingredient to detect it.</p>
                <input type="file" accept="image/*" onChange={onUploadChange} className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-2 text-sm text-slate-700 dark:text-slate-300 shadow-inner outline-none focus:border-primary-500 dark:focus:border-primary-500 transition-colors" />
                <button onClick={scanPantryImage} className="w-full rounded-xl bg-primary-500 dark:bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-primary-400 dark:hover:bg-primary-500 shadow-[0_4px_15px_rgba(16,185,129,0.3)] dark:shadow-inner hover:-translate-y-0.5 active:translate-y-0">
                  Analyze Image
                </button>
              </div>
            )}

            {status ? <p className="relative z-10 mt-4 rounded-lg bg-primary-50 dark:bg-primary-900/40 px-3 py-2 text-sm font-bold text-primary-700 dark:text-primary-300 text-center animate-pulse border border-primary-200 dark:border-primary-800/50 shadow-sm">{status}</p> : null}

            {ingredients.length > 0 && (
              <div className="relative z-10 mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Scanned Ingredients ({ingredients.length})</h3>
                  <button 
                    onClick={() => setIngredients([])}
                    className="text-xs font-medium text-slate-500 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Clear all ingredients"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                  {ingredients.map((item) => (
                    <div key={item.id} className="group relative flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/50 p-2 shadow-sm dark:shadow-inner transition-all hover:border-primary-300 dark:hover:border-slate-500">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate pr-2">{item.name}</span>
                      <button 
                        onClick={() => removeIngredient(item.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="relative z-10 mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
              <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300 mb-2">Postal Zip Code</label>
              <input
                type="text"
                value={zipCode}
                onChange={(event) => setZipCode(event.target.value)}
                placeholder="e.g. 90210"
                className="w-full rounded-2xl border-[1.5px] border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-950/50 py-3 px-4 text-sm font-bold text-slate-800 dark:text-slate-200 shadow-inner outline-none transition focus:border-primary-500 dark:focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 mb-5"
              />

              <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300 mb-2">Number of Servings</label>
              <input
                type="number"
                min="1"
                value={servingsInput}
                onChange={(event) => setServingsInput(event.target.value)}
                className="w-full rounded-2xl border-[1.5px] border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-950/50 py-3 px-4 text-sm font-bold text-slate-800 dark:text-slate-200 shadow-inner outline-none transition focus:border-primary-500 dark:focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
              />

              <button
                onClick={estimateCosts}
                disabled={isGenerating || ingredients.length === 0}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 dark:from-primary-600 dark:to-secondary-600 px-4 py-4 text-sm font-extrabold text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)] dark:shadow-inner transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(16,185,129,0.4)] active:translate-y-0 disabled:opacity-60 flex justify-center items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Consulting AI...
                  </>
                ) : (
                  "Estimate Costs via AI"
                )}
              </button>
              {errorStatus && <p className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm font-bold text-red-700 dark:text-red-300 border-l-4 border-red-400 dark:border-red-500/50 shadow-sm">{errorStatus}</p>}
            </div>
          </section>
        </div>

        {/* Right Column: Dynamic Pricing Results */}
        <div className="md:col-span-7 lg:col-span-7 flex flex-col gap-6">
          {ingredientPrices.length ? (
            <div className="space-y-6">
              {/* Dynamic Dashboard Readout */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="rounded-[2rem] bg-slate-900 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] dark:shadow-inner relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-100" />
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-slate-300 transition-opacity group-hover:opacity-30"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                  <h3 className="relative z-10 text-slate-300 dark:text-slate-400 font-extrabold text-sm uppercase tracking-wide">Total Recipe Cost</h3>
                  <p className="relative z-10 mt-2 text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">${totalCost.toFixed(2)}</p>
                </div>
                <div className="rounded-[2rem] bg-primary-600 dark:bg-primary-900/40 border border-primary-500 dark:border-primary-800/50 p-6 shadow-[0_8px_30px_rgba(16,185,129,0.3)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] dark:shadow-inner relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-100" />
                  <div className="absolute top-0 right-0 p-4 opacity-20 text-white transition-opacity group-hover:opacity-40"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
                  <h3 className="relative z-10 text-primary-100 dark:text-primary-300 font-extrabold text-sm uppercase tracking-wide">Cost Per Serving</h3>
                  <p className="relative z-10 mt-2 text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">${costPerServing.toFixed(2)}</p>
                </div>
              </section>

              {/* Ingredient breakdown cards */}
              <section className="relative rounded-[2rem] border border-white/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] dark:shadow-inner backdrop-blur-xl transition-all duration-300">
                <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-white/40 to-transparent opacity-100 dark:opacity-10 pointer-events-none" />
                <h2 className="relative z-10 text-xl font-extrabold text-primary-600 dark:text-primary-400 mb-6 flex items-center gap-2 drop-shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  Itemized Estimate
                </h2>
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {ingredientPrices.map((item, index) => (
                    <div key={index} className="group relative flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/50 p-4 shadow-sm dark:shadow-inner transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 dark:hover:border-slate-500 hover:shadow-[0_10px_20px_rgba(16,185,129,0.1)] dark:hover:shadow-md">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 pr-3 truncate capitalize relative z-10">{item.name}</span>
                      <span className="shrink-0 flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/50 px-3 py-1.5 text-sm font-extrabold text-primary-800 dark:text-primary-300 relative z-10 border border-primary-200 dark:border-primary-800/30 shadow-sm">${item.price}</span>
                      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-r from-white/40 to-transparent dark:from-slate-800/0 dark:to-slate-700/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
             <div className="h-full flex items-center justify-center p-12 rounded-[2rem] border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 min-h-[300px]">
               <div className="text-center">
                 <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                 </div>
                 <h3 className="text-lg font-extrabold text-slate-700 dark:text-slate-300">Waiting for Ingredients...</h3>
                 <p className="mt-2 text-sm font-medium text-slate-500 max-w-sm">Scan your ingredients and click estimate to let the AI calculate average retail pricing for your recipe based on your zip code.</p>
               </div>
             </div>
          )}
        </div>
      </div>
    </main>
  );
}
