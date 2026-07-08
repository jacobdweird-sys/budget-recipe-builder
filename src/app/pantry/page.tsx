"use client";

import { useRef, useState, ChangeEvent } from "react";
import Link from "next/link";
import Webcam from "react-webcam";
import { Upload, Camera, Zap } from "lucide-react";

export default function PantryPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setSaved(false);
    setError("");
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  }

  async function captureFromWebcam() {
    if (!webcamRef.current) return;
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setError("Failed to capture photo. Please try again.");
        return;
      }
      setPreviewUrl(imageSrc);
      const blob = await (await fetch(imageSrc)).blob();
      const file = new File([blob], "pantry-photo.jpg", { type: "image/jpeg" });
      setImageFile(file);
      setIsCameraMode(false);
      setSaved(false);
      setError("");
    } catch (err) {
      setError("Camera error. Please try uploading a file instead.");
    }
  }

  async function scanPantry() {
    if (!imageFile) return;
    setIsScanning(true);
    setError("");
    try {
      const form = new FormData();
      form.append("image", imageFile);
      const response = await fetch("/api/pantry-scan", {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        throw new Error("Scan failed. Please try another photo.");
      }
      const data = (await response.json()) as { ingredients: string[]; source: string };
      setIngredients(data.ingredients ?? []);
      setSource(data.source ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while scanning.");
    } finally {
      setIsScanning(false);
    }
  }

  function removeIngredient(name: string) {
    setIngredients((prev) => prev.filter((item) => item !== name));
    setSaved(false);
  }

  function sendToBudgetPlanner() {
    localStorage.setItem("scannedIngredients", JSON.stringify(ingredients));
    setSaved(true);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-8 text-slate-900 dark:text-slate-200">
      <section className="relative rounded-2xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-white/40 to-transparent opacity-100 dark:opacity-10 pointer-events-none" />

        <h1 className="relative z-10 text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent drop-shadow-sm">
          Pantry Scanner
        </h1>
        <p className="relative z-10 mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
          Snap a photo of your pantry or fridge and we&apos;ll pull out ingredient hints you can feed straight into the Budget Meals planner.
        </p>

        {/* Camera / Upload Toggle */}
        <div className="relative z-10 mt-6 flex gap-3 justify-center">
          <button
            onClick={() => {
              setIsCameraMode(false);
              setError("");
            }}
            className={`flex-1 rounded-lg px-4 py-2.5 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              !isCameraMode
                ? "bg-primary-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Upload size={18} />
            Upload File
          </button>
          <button
            onClick={() => {
              setIsCameraMode(true);
              setError("");
            }}
            className={`flex-1 rounded-lg px-4 py-2.5 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              isCameraMode
                ? "bg-primary-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Camera size={18} />
            Use Camera
          </button>
        </div>

        {/* Upload area */}
        {!isCameraMode && (
          <div className="relative z-10 mt-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-950/40 p-6 text-center transition-colors hover:border-primary-400 dark:hover:border-primary-500"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Pantry preview"
                  className="mx-auto max-h-64 rounded-lg object-contain"
                />
              ) : (
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Tap to choose a pantry photo (JPG or PNG)
                </span>
              )}
            </button>
          </div>
        )}

        {/* Camera mode */}
        {isCameraMode && (
          <div className="relative z-10 mt-6 rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-700">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full"
            />
            <button
              onClick={captureFromWebcam}
              className="w-full bg-primary-500 text-white font-bold py-3 hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={18} />
              Capture Photo
            </button>
          </div>
        )}

        <button
          onClick={scanPantry}
          disabled={!imageFile || isScanning}
          className="relative z-10 mt-6 w-full rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 px-4 py-3.5 text-sm font-extrabold text-white transition-all duration-300 hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:shadow-none shadow-[0_6px_20px_rgba(16,185,129,0.3)] hover:-translate-y-1 active:translate-y-0 transform"
        >
          {isScanning ? "Scanning..." : "Scan Pantry"}
        </button>

        {error && (
          <p className="relative z-10 mt-3 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
        )}
      </section>

      {ingredients.length > 0 && (
        <section className="relative rounded-2xl border border-white/60 dark:border-slate-800 bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
          <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-white/40 to-transparent opacity-100 dark:opacity-10 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <h2 className="text-lg font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent">
              Detected Ingredients
            </h2>
            {source && (
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {source === "fallback" ? "estimated" : source}
              </span>
            )}
          </div>

          <div className="relative z-10 mt-4 flex flex-wrap gap-2">
            {ingredients.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary-300 dark:border-primary-700/50 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-900/20 px-3 py-1.5 text-sm font-bold text-primary-800 dark:text-primary-300"
              >
                {item}
                <button
                  onClick={() => removeIngredient(item)}
                  aria-label={`Remove ${item}`}
                  className="text-primary-600 dark:text-primary-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <button
            onClick={sendToBudgetPlanner}
            className="relative z-10 mt-6 w-full rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 px-4 py-3.5 text-sm font-extrabold text-white transition-all duration-300 hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] shadow-[0_6px_20px_rgba(16,185,129,0.3)] hover:-translate-y-1 active:translate-y-0 transform"
          >
            Send to Budget Planner
          </button>

          {saved && (
            <p className="relative z-10 mt-3 text-center text-sm font-bold text-primary-700 dark:text-primary-300">
              Saved!{" "}
              <Link href="/budget" className="underline underline-offset-2">
                Open Budget Meals
              </Link>{" "}
              to generate recipes with these ingredients.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
