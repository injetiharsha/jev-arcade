"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Trash2,
  Activity,
  Maximize2,
  Minimize2,
  Fingerprint,
  Gamepad2,
} from "lucide-react";
import { useTrace } from "@/context/TraceContext";

interface TraceSidebarProps {
  className?: string;
}

export function TraceSidebar({ className = "" }: TraceSidebarProps) {
  const {
    sessionId,
    gameId,
    steps,
    clearTrace,
    totalSteps,
    accuracyPct,
    avgConfidence,
    avgLatency,
  } = useTrace();

  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [isCollapsedMobile, setIsCollapsedMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new steps arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps.length]);

  const toggleExpand = (stepNum: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  return (
    <aside
      className={`flex flex-col bg-gray-900 text-gray-100 dark:bg-[#0f0c13] dark:text-gray-200 border-l border-gray-800 dark:border-purple-900/40 shadow-2xl rounded-2xl overflow-hidden font-mono text-sm transition-all duration-200 ${className}`}
    >
      {/* 1. Header & Live Running Tally */}
      <div className="p-4 bg-gray-950/80 dark:bg-black/60 border-b border-gray-800 dark:border-purple-900/50 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-sm">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Jev Reasoning Trace
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-sans">
                Real-time System One decision telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {steps.length > 0 && (
              <button
                onClick={clearTrace}
                title="Clear Trace History"
                className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsCollapsedMobile(!isCollapsedMobile)}
              className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              title="Toggle Panel"
            >
              {isCollapsedMobile ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Reference IDs Display (Session & Game) */}
        <div className="flex items-center justify-between bg-black/40 px-2.5 py-1.5 rounded-lg border border-gray-800 dark:border-purple-950 text-[10px] text-gray-400 mb-2.5">
          <div className="flex items-center gap-1">
            <Fingerprint className="w-3 h-3 text-purple-400" />
            <span>SESS:</span>
            <span className="font-mono text-purple-300 font-semibold" title={`Session ID: ${sessionId}`}>
              {sessionId ? `${sessionId.slice(0, 6)}...${sessionId.slice(-3)}` : "—"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Gamepad2 className="w-3 h-3 text-pink-400" />
            <span>GAME:</span>
            <span className="font-mono text-pink-300 font-semibold" title={`Game ID: ${gameId || "N/A"}`}>
              {gameId ? `${gameId.slice(0, 6)}...${gameId.slice(-3)}` : "None"}
            </span>
          </div>
        </div>

        {/* Live Metrics Running Tally */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-800/80 dark:border-purple-900/30 text-center font-sans">
          <div className="bg-gray-900/90 dark:bg-purple-950/20 p-2 rounded-xl border border-gray-800 dark:border-purple-900/30">
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Steps
            </div>
            <div className="text-sm font-bold text-white mt-0.5 font-mono">
              {totalSteps}
            </div>
          </div>

          <div className="bg-gray-900/90 dark:bg-purple-950/20 p-2 rounded-xl border border-gray-800 dark:border-purple-900/30">
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Accuracy
            </div>
            <div
              className={`text-sm font-bold mt-0.5 font-mono ${
                accuracyPct === null
                  ? "text-gray-400"
                  : accuracyPct >= 70
                  ? "text-emerald-400"
                  : accuracyPct >= 40
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {accuracyPct !== null ? `${accuracyPct}%` : "—"}
            </div>
          </div>

          <div className="bg-gray-900/90 dark:bg-purple-950/20 p-2 rounded-xl border border-gray-800 dark:border-purple-900/30">
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Avg Conf
            </div>
            <div className="text-sm font-bold text-purple-300 mt-0.5 font-mono">
              {avgConfidence !== null ? `${avgConfidence}%` : "—"}
            </div>
          </div>

          <div className="bg-gray-900/90 dark:bg-purple-950/20 p-2 rounded-xl border border-gray-800 dark:border-purple-900/30">
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Avg Lat
            </div>
            <div className="text-sm font-bold text-cyan-300 mt-0.5 font-mono">
              {avgLatency !== null ? `${avgLatency}ms` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Step Log Stream */}
      <div
        ref={scrollRef}
        className={`flex-1 p-3.5 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[360px] custom-scrollbar ${
          isCollapsedMobile ? "hidden lg:block" : "block"
        }`}
      >
        {steps.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <Activity className="w-10 h-10 text-gray-700 dark:text-purple-950 mb-3 animate-pulse" />
            <p className="text-sm text-gray-400 font-sans font-medium">
              Awaiting Jev Activity...
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-500 font-sans mt-1 max-w-[240px]">
              Make a move in Tic-Tac-Toe or click any cell in Sudoku to view live reasoning traces.
            </p>
          </div>
        ) : (
          steps.map((step) => {
            const isExpanded = !!expandedSteps[step.stepNumber];
            const isPositive =
              step.isCorrect === true || step.isOptimal === true;
            const isNegative =
              step.isCorrect === false || step.isOptimal === false;

            return (
              <div
                key={step.stepNumber}
                className="bg-gray-950/60 dark:bg-purple-950/15 border border-gray-800/90 dark:border-purple-900/30 rounded-xl p-3 hover:border-purple-500/40 transition-all text-xs"
              >
                {/* Step Top Bar */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 text-xs">
                      #{step.stepNumber}
                    </span>
                    <span className="font-semibold text-gray-200 text-sm">
                      {step.game.toUpperCase()}
                    </span>
                  </div>

                  {/* Verdict Badge */}
                  {isPositive && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {step.game === "tictactoe" ? "OPTIMAL" : "CORRECT"}
                    </span>
                  )}
                  {isNegative && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/50 border border-rose-500/30 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3.5 h-3.5" />
                      {step.game === "tictactoe" ? "SUBOPTIMAL" : "INCORRECT"}
                    </span>
                  )}
                  {!isPositive && !isNegative && (
                    <span className="text-[10px] text-gray-400 bg-gray-800/60 px-2 py-0.5 rounded-full">
                      EVALUATED
                    </span>
                  )}
                </div>

                {/* Context & Choice */}
                <div className="mt-2.5 font-sans text-gray-300 text-sm">
                  {step.context}
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] bg-black/40 p-2 rounded-lg border border-gray-800/80">
                  <div>
                    <span className="text-gray-400 block text-[10px]">CHOICE</span>
                    <span className="font-bold text-white font-mono text-sm">
                      {step.choice}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px]">CONFIDENCE</span>
                    <span className="font-bold text-purple-400 font-mono text-sm">
                      {Math.round(step.confidence * 100)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px]">LATENCY</span>
                    <span className="font-bold text-cyan-400 font-mono text-sm">
                      {step.latencyMs}ms
                    </span>
                  </div>
                </div>

                {/* Optimal Moves Note (TicTacToe) */}
                {step.game === "tictactoe" && step.optimalMoves && (
                  <div className="mt-2 text-[11px] text-gray-400 flex items-center justify-between font-sans">
                    <span>Optimal Choice(s):</span>
                    <span className="font-mono text-purple-300 font-semibold">
                      [{step.optimalMoves.join(", ")}]
                    </span>
                  </div>
                )}

                {/* Collapsible Prompt / State / Criteria Payload */}
                {(step.stateSent || step.instructionsSent || step.criteriaSent) && (
                  <div className="mt-2.5 pt-2 border-t border-gray-800/60">
                    <button
                      onClick={() => toggleExpand(step.stepNumber)}
                      className="flex items-center gap-1.5 text-[11px] text-purple-400 hover:text-purple-300 transition-colors w-full font-sans font-medium cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isExpanded ? "Hide Full Prompt" : "Inspect State, Instructions & Criteria"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-2.5 bg-black/80 rounded-lg border border-purple-900/40 space-y-2 text-[11px] font-mono text-gray-300">
                        {step.instructionsSent && (
                          <div>
                            <div className="text-[10px] text-purple-400 font-bold uppercase mb-1">
                              Instructions:
                            </div>
                            <div className="whitespace-pre-wrap leading-relaxed text-gray-300 bg-gray-900/60 p-1.5 rounded text-[11px]">
                              {step.instructionsSent}
                            </div>
                          </div>
                        )}

                        {step.criteriaSent && (
                          <div>
                            <div className="text-[10px] text-cyan-400 font-bold uppercase mb-1">
                              Tactical Criteria Descriptions:
                            </div>
                            <pre className="p-1.5 bg-gray-900/60 rounded text-[10px] overflow-x-auto text-cyan-300 leading-relaxed">
                              {JSON.stringify(step.criteriaSent, null, 2)}
                            </pre>
                          </div>
                        )}

                        {step.stateSent && (
                          <div>
                            <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1">
                              State Formatted:
                            </div>
                            <pre className="p-1.5 bg-gray-900/60 rounded text-[10px] overflow-x-auto text-emerald-300">
                              {step.stateSent}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
