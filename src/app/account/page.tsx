"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useRef } from "react";
import { Leaf, Clipboard, ChefHat } from "lucide-react";

function hasRecoveryHash() {
  if (typeof window === "undefined") return false;
  return window.location.hash.toLowerCase().includes("type=recovery");
}

const DIETARY_OPTIONS = [
  "Vegan",
  "Vegetarian",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Keto",
  "Paleo",
  "Low-Carb",
  "High-Protein",
  "Mediterranean",
  "Halal",
  "Kosher",
] as const;

export default function AccountPage() {
  // -------------------- Auth state --------------------
  const recoveryDetected = hasRecoveryHash();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [message, setMessage] = useState(
    recoveryDetected ? "Recovery session detected. Enter a new password." : ""
  );
  const [mode, setMode] = useState<"signIn" | "signUp" | "reset">("signIn");
  const [authLoading, setAuthLoading] = useState(false);

  // -------------------- Password Reset & Security state --------------------
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetToken, setResetToken] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [secNewPassword, setSecNewPassword] = useState("");
  const [secConfirmPassword, setSecConfirmPassword] = useState("");
  const [securityMsg, setSecurityMsg] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // -------------------- Dashboard state --------------------
  const [activeTab, setActiveTab] = useState<"profile" | "ingredients" | "recipes">("profile");
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editDiet, setEditDiet] = useState<string[]>([]);
  const [editBudget, setEditBudget] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const [ingredients, setIngredients] = useState<Array<{name?: string; ingredient_name?: string; id?: string}>>([]);
  const [history, setHistory] = useState<Array<{title?: string; name?: string; id?: string}>>([]);

  // -------------------- Helpers --------------------
  const getArrayFromData = (raw: unknown): unknown[] => {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray(raw.data)) return raw.data;
    if (raw && typeof raw === 'object' && 'ingredients' in raw && Array.isArray(raw.ingredients)) return raw.ingredients;
    if (raw && typeof raw === 'object' && 'history' in raw && Array.isArray(raw.history)) return raw.history;
    return [];
  };

  const loadDashboardData = async () => {
    try {
      const [ingRes, histRes] = await Promise.all([
        fetch("/api/ingredients"),
        fetch("/api/history"),
      ]);
      if (ingRes.ok) {
        const raw = await ingRes.json();
        setIngredients(raw);
      }
      if (histRes.ok) {
        const raw = await histRes.json();
        setHistory(raw);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const user = data.user;
          setUserEmail(user.email);
          setUserName(user.name || "");
          setAvatarUrl(user.avatarUrl || null);

          setEditName(user.name || "");
          setEditAvatarFile(null);
          setAvatarPreview(null);

          await loadDashboardData();
          return;
        }
      }
      setUserEmail(null);
    } catch {
      setUserEmail(null);
    }
  };

  useEffect(() => {
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setEditAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  // Toggle dietary option
  const toggleDietary = (option: string) => {
    setEditDiet((prev) =>
      prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option]
    );
  };

  // -------------------- Auth actions --------------------
  async function signUp() {
    setAuthLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        await fetchSession();
        setMessage("");
      } else if (res.status === 400) {
        setMessage("Email already exists. Switching to Sign In.");
        setMode("signIn");
        setEmail("");
        setPassword("");
      } else {
        setMessage("An error occurred. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setMessage("An error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function signIn() {
    setAuthLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        await fetchSession();
      } else if (res.status === 400) {
        setMessage("Invalid credentials.");
      } else {
        setMessage("An error occurred. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setMessage("An error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function requestResetToken() {
    setAuthLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetStep(2);
        setMessage(data.message || "Verification code generated! Please check server console.");
        if (data.devToken) {
          setResetToken(data.devToken);
          console.log("[DEV MODE] Auto-populated reset token:", data.devToken);
        }
      } else {
        setMessage(data.error || "An error occurred. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setMessage("An error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function completeResetPassword() {
    if (newPassword !== confirmNewPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setAuthLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: resetToken, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Password reset successfully. You can now sign in.");
        setMode("signIn");
        setEmail("");
        setNewPassword("");
        setConfirmNewPassword("");
        setResetToken("");
        setResetStep(1);
      } else {
        setMessage(data.error || "An error occurred. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setMessage("An error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (secNewPassword !== secConfirmPassword) {
      setSecurityMsg("New passwords do not match.");
      return;
    }
    setIsChangingPassword(true);
    setSecurityMsg("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword: secNewPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSecurityMsg("Password updated successfully!");
        setCurrentPassword("");
        setSecNewPassword("");
        setSecConfirmPassword("");
      } else {
        setSecurityMsg(data.error || "Failed to update password.");
      }
    } catch (err) {
      console.error(err);
      setSecurityMsg("Network error. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  // -------------------- Profile update --------------------
  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setProfileMsg("");

    const formData = new FormData();
    formData.append("name", editName);
    formData.append("bio", editBio);
    formData.append("dietaryPreferences", JSON.stringify(editDiet));
    formData.append("budgetGoal", editBudget ? parseFloat(editBudget).toString() : "");
    formData.append("location", editLocation);
    if (editAvatarFile) {
      formData.append("avatar", editAvatarFile);
    }

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        body: formData, // no Content-Type header → browser sets multipart
      });

      if (res.ok) {
        // Update local state with new values
        setUserName(editName);
        if (editAvatarFile) {
          // Assume backend returns new avatarUrl; else keep preview
          setAvatarUrl(avatarPreview);
        }
        setProfileMsg("Profile updated successfully!");
        setEditAvatarFile(null);
        // Optionally refresh session to get server-side avatar URL
        // fetchSession();
      } else {
        const data = await res.json().catch(() => ({}));
        setProfileMsg(data?.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setProfileMsg("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    setUserEmail(null);
  }


  // -------------------- NOT AUTHENTICATED --------------------
  if (!userEmail) {
    return (
      <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzNDQ5NjYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIxLjUiIGN5PSIxLjUiIHI9IjEuNSIvPjwvZz48L2c+PC9zdmc+')] opacity-20 pointer-events-none" />
        <div className="w-full max-w-md bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-primary-500/20 shadow-2xl shadow-primary-500/10 p-8 relative z-10 transform transition-all hover:scale-[1.01]">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500/20 via-transparent to-secondary-500/20 -z-10 blur-xl" />
          <h1 className="text-4xl font-black text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-white to-secondary-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
            {mode === "reset" ? "Reset Password" : mode === "signUp" ? "Create Account" : "Welcome Back"}
          </h1>
          {message && (
            <p className="text-center mb-4 text-sm font-bold text-primary-300 bg-primary-500/10 border border-primary-500/30 p-3 rounded-xl backdrop-blur-sm">
              {message}
            </p>
          )}
          <div className="space-y-4">
            {/* Show email input for Sign In, Sign Up, or Step 1 of Password Reset */}
            {(mode !== "reset" || resetStep === 1) && (
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-slate-100 placeholder-slate-500"
              />
            )}

            {/* Show normal password input only for Sign In and Sign Up */}
            {mode !== "reset" && (
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-slate-100 placeholder-slate-500"
              />
            )}

            {/* Step 2 of Password Reset: Show Token, New Password, Confirm Password */}
            {mode === "reset" && resetStep === 2 && (
              <>
                <div className="text-slate-400 text-xs font-semibold px-1">
                  Email: <span className="text-slate-200">{email}</span>
                </div>
                <input
                  type="text"
                  placeholder="Verification Code (6 digits)"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-slate-100 placeholder-slate-500"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-slate-100 placeholder-slate-500"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-slate-100 placeholder-slate-500"
                />
              </>
            )}

            <button
              onClick={() => {
                if (mode === "signIn") signIn();
                else if (mode === "signUp") signUp();
                else if (resetStep === 1) requestResetToken();
                else completeResetPassword();
              }}
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 disabled:from-slate-700 disabled:to-slate-700 text-slate-900 font-black py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary-500/25 flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg> Processing...
                </>
              ) : mode === "reset" ? (
                resetStep === 1 ? "Send Verification Code" : "Update Password"
              ) : mode === "signUp" ? (
                "Sign Up"
              ) : (
                "Sign In"
              )}
            </button>
          </div>
          <div className="mt-6 flex gap-3 justify-center text-sm font-semibold">
            <button onClick={() => { setMode("signIn"); setMessage(""); setResetStep(1); setResetToken(""); }} className="text-primary-400 hover:text-primary-300">Sign In</button>
            <span className="text-slate-700">|</span>
            <button onClick={() => { setMode("signUp"); setMessage(""); setResetStep(1); setResetToken(""); }} className="text-primary-400 hover:text-primary-300">Sign Up</button>
            <span className="text-slate-700">|</span>
            <button onClick={() => { setMode("reset"); setMessage(""); setResetStep(1); setResetToken(""); }} className="text-primary-400 hover:text-primary-300">Reset</button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------- AUTHENTICATED DASHBOARD --------------------
  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4 md:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzNDQ5NjYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIxLjUiIGN5PSIxLjUiIHI9IjEuNSIvPjwvZz48L2c+PC9zdmc+')] opacity-20 pointer-events-none" />
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header card */}
        <div className="bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-primary-500/20 shadow-2xl shadow-primary-500/10 p-6 md:p-8 mb-6 transform transition-all hover:scale-[1.005]">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 -z-10 blur-xl" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar display: show uploaded image or placeholder */}
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-400/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-2xl text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-white to-secondary-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                  {userName || "Welcome"}&apos;s Dashboard
                </h1>
                <p className="text-slate-400">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tabs + content card */}
        <div className="bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-primary-500/20 shadow-2xl shadow-primary-500/10 p-6 md:p-8 transition-all hover:scale-[1.005]">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 -z-10 blur-xl" />
          <div className="flex gap-2 border-b border-slate-800 mb-8">
            {(["profile", "ingredients", "recipes"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 font-black rounded-t-xl transition-all ${
                  activeTab === tab
                    ? "text-primary-400 border-b-2 border-primary-400 bg-primary-500/10 backdrop-blur-sm shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* ---------- PROFILE TAB ---------- */}
          {activeTab === "profile" && (
            <>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
              {profileMsg && (
                <div
                  className={`p-3 rounded-xl text-sm font-bold ${
                    profileMsg.includes("success")
                      ? "bg-green-500/10 border border-green-500/30 text-green-400"
                      : "bg-red-500/10 border border-red-500/30 text-red-400"
                  }`}
                >
                  {profileMsg}
                </div>
              )}

              {/* Avatar Upload */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : avatarUrl ? (
                      <img src={avatarUrl} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-bold hover:bg-slate-700 transition"
                    >
                      Choose Image
                    </button>
                    <p className="text-xs text-slate-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-slate-100 placeholder-slate-500"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-slate-100 placeholder-slate-500"
                />
              </div>

              {/* Dietary Preferences - multi-select chips */}
              <div>
                <label className="block text-slate-300 font-bold mb-3">
                  Dietary Preferences (click to toggle)
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => toggleDietary(option)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-sm transition-all backdrop-blur-sm ${
                        editDiet.includes(option)
                          ? "bg-primary-500/20 border border-primary-400 text-primary-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                          : "bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-primary-500/30"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">Selected: {editDiet.length > 0 ? editDiet.join(", ") : "None"}</p>
              </div>

              {/* Budget & location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-2">Budget Goal ($)</label>
                  <input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-slate-100 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-2">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="City or zip code"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-slate-100 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Save button */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 disabled:from-slate-700 disabled:to-slate-700 text-slate-900 font-black rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-primary-500/25 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </form>

              {/* Security & Password Reset Section */}
              <div className="border-t border-slate-800 pt-8 mt-8">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-white to-secondary-400 mb-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  Change Password
                </h3>
                <p className="text-slate-400 text-xs font-semibold mb-4">
                  Require your current password to verify your identity before setting a new password.
                </p>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  {securityMsg && (
                    <div
                      className={`p-3 rounded-xl text-sm font-bold ${
                        securityMsg.includes("success") || securityMsg.includes("updated")
                          ? "bg-green-500/10 border border-green-500/30 text-green-400"
                          : "bg-red-500/10 border border-red-500/30 text-red-400"
                      }`}
                    >
                      {securityMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-300 font-bold mb-2 text-sm">Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-slate-100 placeholder-slate-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-2 text-sm">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password (min. 6 chars)"
                      value={secNewPassword}
                      onChange={(e) => setSecNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-slate-100 placeholder-slate-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-2 text-sm">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={secConfirmPassword}
                      onChange={(e) => setSecConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-slate-100 placeholder-slate-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 disabled:from-slate-700 disabled:to-slate-700 text-slate-900 font-black rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-primary-500/25 flex items-center justify-center gap-2 text-sm mt-2"
                  >
                    {isChangingPassword ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg> Changing...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* ---------- INGREDIENTS TAB ---------- */}
          {activeTab === "ingredients" && (
            <div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400 mb-6 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                Saved Ingredients
              </h2>
              {(() => {
                const list = getArrayFromData(ingredients);
                if (list.length === 0) {
                  return (
                    <p className="text-slate-500 bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-sm">
                      No ingredients saved yet. Scan them in the AI Cost Estimator!
                    </p>
                  );
                }
                return (
                  <ul className="space-y-3">
                    {list.map((item: unknown, idx: number) => {
                      const display =
                        (item && typeof item === 'object' && 'name' in item && typeof item.name === 'string') ? item.name :
                        (item && typeof item === 'object' && 'ingredient_name' in item && typeof item.ingredient_name === 'string') ? item.ingredient_name :
                        (typeof item === 'string') ? item : `Ingredient #${idx + 1}`;
                      return (
                        <li
                          key={(item && typeof item === 'object' && 'id' in item && typeof item.id === 'string') ? item.id : idx}
                          className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-primary-500/20 text-slate-200 hover:border-primary-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all transform hover:scale-[1.02] flex items-center gap-3"
                        >
                          <Leaf size={20} className="text-primary-400 flex-shrink-0" />
                          {display}
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </div>
          )}

          {/* ---------- RECIPES TAB ---------- */}
          {activeTab === "recipes" && (
            <div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400 mb-6 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                Recipe History
              </h2>
              {(() => {
                const list = getArrayFromData(history);
                if (list.length === 0) {
                  return (
                    <p className="text-slate-500 bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-sm">
                      No recipes generated yet.
                    </p>
                  );
                }
                return (
                  <ul className="space-y-3">
                    {list.map((item: unknown, idx: number) => {
                      const display =
                        (item && typeof item === 'object' && 'title' in item && typeof item.title === 'string') ? item.title :
                        (item && typeof item === 'object' && 'name' in item && typeof item.name === 'string') ? item.name :
                        (typeof item === 'string') ? item : `Recipe #${idx + 1}`;
                      return (
                        <li
                          key={(item && typeof item === 'object' && 'id' in item && typeof item.id === 'string') ? item.id : idx}
                          className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-secondary-500/20 text-slate-200 hover:border-secondary-400 hover:shadow-[0_0_15px_rgba(244,168,35,0.2)] transition-all transform hover:scale-[1.02] flex items-center gap-3"
                        >
                          <Clipboard size={20} className="text-secondary-400 flex-shrink-0" />
                          {display}
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}