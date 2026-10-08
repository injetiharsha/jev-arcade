"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface AbandonConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  gameType?: string;
}

export function AbandonConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  gameType = "game",
}: AbandonConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#15101a] border border-amber-500/40 rounded-3xl shadow-2xl max-w-md w-full p-6 text-gray-900 dark:text-gray-100 font-sans">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Start New {gameType === "sudoku" ? "Puzzle" : "Game"}?
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          This game isn&apos;t finished yet. If you start a new one, your current progress will be preserved in history as{" "}
          <span className="font-semibold text-amber-500">incomplete / abandoned</span>.
        </p>

        <div className="flex items-center justify-end gap-3 font-medium text-xs">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Resume Playing
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md transition-all cursor-pointer"
          >
            Abandon &amp; Start New
          </button>
        </div>
      </div>
    </div>
  );
}
