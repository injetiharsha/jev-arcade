"use client";

import React, { useState } from "react";
import { KeyRound, X, Sparkles, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { useTrace } from "@/context/TraceContext";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialError?: string | null;
}

export function UpgradeModal({
  isOpen,
  onClose,
  initialError,
}: UpgradeModalProps) {
  const { setByokKey, sessionId } = useTrace();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      setErrorMsg("Please enter your TypeSafe API key.");
      return;
    }

    setIsValidating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await setByokKey(apiKeyInput.trim());
    setIsValidating(false);

    if (res.success) {
      setSuccessMsg("API key verified! Unlimited access unlocked.");
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setApiKeyInput("");
      }, 1200);
    } else {
      setErrorMsg(res.error || "Failed to validate API key with TypeSafe.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#130f18] border border-purple-500/30 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 text-gray-900 dark:text-gray-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center text-pink-500 shrink-0 shadow-inner">
            <KeyRound className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
          Bring Your Own Key (BYOK)
        </h3>

        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Unlock <strong>unlimited, unthrottled</strong> benchmark queries across all games. Usage is billed directly to your own TypeSafe account.
        </p>

        {/* Security Notice */}
        <div className="p-3.5 mb-5 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-[11px] text-gray-600 dark:text-gray-400 space-y-1.5 font-mono">
          <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zero-Retention Key Security:</span>
          </div>
          <p className="leading-normal">
            Your key is <strong>never written to the database</strong> or printed in server logs. It is encrypted in a secure, session-scoped httpOnly cookie.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 font-mono">
              TypeSafe API Key:
            </label>
            <input
              type="password"
              placeholder="apikey_..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              disabled={isValidating}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-white/15 text-xs sm:text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isValidating}
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isValidating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-pink-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isValidating ? "animate-spin" : ""}`} />
              <span>{isValidating ? "Validating Key..." : "Activate Unlimited BYOK"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
