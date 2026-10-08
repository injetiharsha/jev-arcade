"use client";

import React, { useState } from "react";
import { LogOut, X, AlertOctagon } from "lucide-react";
import { useTrace } from "@/context/TraceContext";

interface TerminateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TerminateSessionModal({
  isOpen,
  onClose,
}: TerminateSessionModalProps) {
  const { sessionId, terminateSession } = useTrace();
  const [isTerminating, setIsTerminating] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsTerminating(true);
    try {
      await terminateSession();
    } catch (err) {
      console.error("Failed to terminate session:", err);
      setIsTerminating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-[#15101a] border border-rose-500/30 rounded-3xl shadow-2xl max-w-md w-full p-6 text-gray-900 dark:text-gray-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            disabled={isTerminating}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          End Active Session?
        </h3>

        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          End your session? You&apos;ll start fresh, and this session&apos;s games will remain saved in history. Any in-progress game will be marked as abandoned.
        </p>

        {sessionId && (
          <div className="p-3 mb-6 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-xs font-mono flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Current Session:</span>
            <span className="font-bold text-gray-900 dark:text-white">{sessionId}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 font-medium text-xs">
          <button
            onClick={onClose}
            disabled={isTerminating}
            className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Keep Session Active
          </button>
          <button
            onClick={handleConfirm}
            disabled={isTerminating}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <LogOut className={`w-3.5 h-3.5 ${isTerminating ? "animate-spin" : ""}`} />
            <span>{isTerminating ? "Ending..." : "End Session"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
