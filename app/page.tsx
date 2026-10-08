"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  Grid3X3,
  Gamepad2,
  Sparkles,
  KeyRound,
  Zap,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Lock,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useTrace } from "@/context/TraceContext";

export default function Home() {
  const { authMode, remainingCalls, setShowUpgradeModal, setFreeMode } = useTrace();
  const [isActivatingFree, setIsActivatingFree] = useState(false);

  const handleStartFree = async () => {
    setIsActivatingFree(true);
    try {
      await setFreeMode();
    } finally {
      setIsActivatingFree(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 text-center transition-colors">
      <div className="max-w-5xl w-full bg-white dark:bg-[#130f17]/90 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-10 md:p-12 backdrop-blur-xl shadow-2xl space-y-8">
        {/* Header Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 text-xs font-mono tracking-wide uppercase font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Benchmarking TypeSafe Jev System One
          </div>
          <Link
            href="/about"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-medium transition-all"
          >
            <Info className="w-3.5 h-3.5" />
            System Architecture & Specs →
          </Link>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-400 dark:via-pink-400 dark:to-indigo-300 bg-clip-text text-transparent tracking-tight">
            Jev Arcade
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            High-speed evaluation harness testing TypeSafe’s ultra-low latency System One model
            on structured reasoning, confidence calibration, and deterministic rule adherence.
          </p>
        </div>

        {/* Current Access Mode Status & Gate */}
        <div className="p-6 rounded-2xl bg-gray-50/80 dark:bg-black/40 border border-gray-200 dark:border-white/10 shadow-inner">
          {authMode === "byok" ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      BYOK Unlimited Mode Active
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
                      Encrypted Session
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your key is AES-256 encrypted in an httpOnly session cookie with zero database retention.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-gray-200 transition-all cursor-pointer whitespace-nowrap"
              >
                Change API Key
              </button>
            </div>
          ) : authMode === "free" ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      Free Evaluation Quota Active
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/15 text-pink-700 dark:text-pink-300 font-bold">
                      {remainingCalls !== null ? `${remainingCalls}/10 Calls Left` : "Active"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Includes 5 Sudoku cell evaluations + 5 Tic-Tac-Toe moves (or any 10 calls combined).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-md shadow-pink-500/20 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Enter Key for Unlimited
              </button>
            </div>
          ) : (
            /* First visit / Unselected gate */
            <div className="space-y-4">
              <div className="text-center max-w-lg mx-auto">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  Choose Your Access Tier
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Evaluate Jev with our free sandbox quota or connect your own TypeSafe API key for unthrottled benchmarks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {/* Option 1: BYOK */}
                <div
                  onClick={() => setShowUpgradeModal(true)}
                  className="group relative p-5 bg-white dark:bg-white/5 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 border-2 border-purple-500/30 hover:border-purple-500 rounded-2xl transition-all cursor-pointer shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold">
                        Recommended
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        Bring Your Own Key (BYOK)
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Unlimited Sudoku autocompletion and Tic-Tac-Toe matches directly with your TypeSafe account.
                      </p>
                    </div>
                    <ul className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>AES-256 encrypted httpOnly cookie</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Zero server database or console logging</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Instant live validation before saving</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                    <span>Activate API Key</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Option 2: Free Demo */}
                <div
                  onClick={handleStartFree}
                  className="group relative p-5 bg-white dark:bg-white/5 hover:bg-pink-500/5 dark:hover:bg-pink-500/10 border-2 border-pink-500/30 hover:border-pink-500 rounded-2xl transition-all cursor-pointer shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-pink-500/15 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-pink-500/15 text-pink-700 dark:text-pink-300 font-bold">
                        10 Free Calls
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                        Try Instant Sandbox
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Explore Jev’s decision speed and telemetry with 10 free calls across Sudoku and Tic-Tac-Toe.
                      </p>
                    </div>
                    <ul className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                        <span>5 Sudoku cells + 5 Tic-Tac-Toe moves</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                        <span>No credit card or sign-up required</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                        <span>Live telemetry and calibration logs</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-pink-600 dark:text-pink-400">
                    <span>{isActivatingFree ? "Activating Trial..." : "Start Free Evaluation"}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Game Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
          {/* Game 1: Sudoku Oracle */}
          <Link
            href="/sudoku"
            className="group p-6 bg-gradient-to-b from-purple-500/5 to-purple-500/10 dark:from-[#17121b] dark:to-[#120e16] hover:from-purple-500/15 hover:to-purple-500/20 border border-purple-500/20 hover:border-purple-500/50 rounded-2xl transition-all hover:shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Sudoku Oracle
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 font-mono font-medium">
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Step-by-step single-cell evaluation and full auto-complete with live error compounding telemetry.
              </p>
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-6 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
              Launch Sudoku →
            </div>
          </Link>

          {/* Game 2: Tic-Tac-Toe Arena */}
          <Link
            href="/tictactoe"
            className="group p-6 bg-gradient-to-b from-pink-500/5 to-pink-500/10 dark:from-[#17121b] dark:to-[#120e16] hover:from-pink-500/15 hover:to-pink-500/20 border border-pink-500/20 hover:border-pink-500/50 rounded-2xl transition-all hover:shadow-xl hover:shadow-pink-500/10 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  Tic-Tac-Toe Arena
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/15 text-pink-700 dark:text-pink-300 font-mono font-medium">
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Play against Jev and compare its fast neural choices against game-theoretic minimax optimality.
              </p>
            </div>
            <div className="text-xs text-pink-600 dark:text-pink-400 font-semibold mt-6 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
              Play Tic-Tac-Toe →
            </div>
          </Link>

          {/* Telemetry & Calibration Dashboard */}
          <Link
            href="/stats"
            className="group p-6 bg-gradient-to-b from-indigo-500/5 to-indigo-500/10 dark:from-[#17121b] dark:to-[#120e16] hover:from-indigo-500/15 hover:to-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/50 rounded-2xl transition-all hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Live Telemetry
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono font-medium">
                  Report
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Empirical latency percentiles, calibration curves, ECE tracking, and error-compounding graphs.
              </p>
            </div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-6 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
              View Analytics →
            </div>
          </Link>
        </div>

        {/* System & Architecture Info Bar */}
        <div className="text-xs bg-gray-100 dark:bg-black/50 p-4 rounded-2xl border border-gray-200 dark:border-white/5 text-left font-mono text-gray-600 dark:text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-pink-500" />
            <span>Target Model: <strong className="text-pink-600 dark:text-pink-300 font-semibold">jev-latest (TypeSafe System One)</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>DB: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">Neon Serverless Postgres / SQLite</strong></span>
          </div>
        </div>
      </div>
    </main>
  );
}
