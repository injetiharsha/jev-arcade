"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { useState } from "react";
import { Sun, Moon, Gamepad2, Grid3X3, BarChart3, Database, LogOut, Zap, KeyRound, Info } from "lucide-react";
import { useTrace } from "@/context/TraceContext";
import { TerminateSessionModal } from "./TerminateSessionModal";
import { UpgradeModal } from "./UpgradeModal";

export function Navbar() {
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { sessionId, authMode, remainingCalls, showUpgradeModal, setShowUpgradeModal } = useTrace();
  const [showTerminateModal, setShowTerminateModal] = useState(false);

  const links = [
    { href: "/sudoku", label: "Sudoku", icon: Grid3X3 },
    { href: "/tictactoe", label: "Tic-Tac-Toe", icon: Gamepad2 },
    { href: "/stats", label: "Telemetry", icon: BarChart3 },
    { href: "/data", label: "Data Log", icon: Database },
    { href: "/about", label: "About", icon: Info },
  ];

  return (
    <>
      <nav className="w-full border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0d0a0f]/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-md group-hover:scale-105 transition-transform">
              J
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Jev Arcade
            </span>
          </Link>

          {/* Links & Usage Gating Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-purple-500/10 dark:bg-pink-500/15 text-purple-700 dark:text-pink-300 border border-purple-500/20 dark:border-pink-500/30"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="h-4 w-px bg-gray-300 dark:bg-white/10 mx-1" />

            {/* Quota / BYOK Status Badge */}
            {authMode === "byok" ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-bold border border-emerald-500/20">
                <KeyRound className="w-3 h-3" />
                <span className="hidden sm:inline">BYOK Unlimited</span>
              </span>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  remainingCalls !== null && remainingCalls > 0
                    ? "bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:bg-pink-500/20 border border-pink-500/20"
                    : "bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 animate-pulse"
                }`}
                title="Click to upgrade / enter own API key"
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>
                  {remainingCalls !== null && remainingCalls > 0
                    ? `${remainingCalls}/10 Free`
                    : "0/10 Upgrade"}
                </span>
              </button>
            )}

            {/* Terminate Session Button */}
            {sessionId && (
              <button
                onClick={() => setShowTerminateModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
                title={`End Session (${sessionId})`}
                aria-label="Terminate Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">End Session</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-colors cursor-pointer"
              title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle Theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-purple-600" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Terminate Session Confirmation Modal */}
      <TerminateSessionModal
        isOpen={showTerminateModal}
        onClose={() => setShowTerminateModal(false)}
      />

      {/* Upgrade / BYOK Key Entry Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
