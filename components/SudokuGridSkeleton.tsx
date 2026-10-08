"use client";

import React from "react";

export function SudokuGridSkeleton() {
  return (
    <div className="grid grid-cols-9 bg-gray-100 dark:bg-[#17121b] border-2 border-purple-500/40 rounded-xl overflow-hidden select-none animate-pulse">
      {Array.from({ length: 81 }).map((_, idx) => {
        const r = Math.floor(idx / 9);
        const c = idx % 9;

        const borderRight =
          c % 3 === 2 && c !== 8
            ? "border-r-2 border-r-purple-500/50"
            : "border-r border-r-gray-300 dark:border-r-white/10";
        const borderBottom =
          r % 3 === 2 && r !== 8
            ? "border-b-2 border-b-purple-500/50"
            : "border-b border-b-gray-300 dark:border-b-white/10";

        // Pseudo-random placeholder pattern
        const isGivenPlaceholder = (r * 3 + c * 7) % 5 === 0;

        return (
          <div
            key={idx}
            className={`w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center ${borderRight} ${borderBottom} bg-white/40 dark:bg-white/5`}
          >
            {isGivenPlaceholder ? (
              <div className="w-5 h-5 rounded-md bg-purple-500/20 dark:bg-purple-500/30" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/10" />
            )}
          </div>
        );
      })}
    </div>
  );
}
