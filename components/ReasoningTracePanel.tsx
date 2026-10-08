"use client";

import { useState, useEffect, useRef } from "react";
import {
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  Gauge,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Minimize2,
  Maximize2,
  Trash2,
  Zap,
} from "lucide-react";

export interface TraceStep {
  stepNumber: number;
  game: "sudoku" | "tictactoe";
  context: string;
  choice: string;
  confidence: number;
  latencyMs: number;
  isCorrect?: boolean | null;
  isOptimal?: boolean | null;
  optimalMoves?: number[];
  stateSent?: string;
  instructionsSent?: string;
  timestamp?: string;
}

interface ReasoningTracePanelProps {
  steps: TraceStep[];
  onClear?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ReasoningTracePanel({
  steps,
  onClear,
  isOpen = true,
  onToggle,
}: ReasoningTracePanelProps) {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [isPanelOpen, setIsPanelOpen] = useState(isOpen);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync internal open state with props if provided
  useEffect(() => {
    setIsPanelOpen(isOpen);
  }, [isOpen]);

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

  // Compute live running tallies
  const totalSteps = steps.length;
  const verifiedSteps = steps.filter(
    (s) => s.isCorrect !== undefined || s.isOptimal !== undefined
  );
  const positiveSteps = steps.filter(
    (s) => s.isCorrect === true || s.isOptimal === true
  );
  const accuracyPct =
    verifiedSteps.length > 0
      ? Math.round((positiveSteps.length / verifiedSteps.length) * 100)
      : null;
  const avgConfidence =
    totalSteps > 0
      ? Math.round(
          (steps.reduce((acc, s) => acc + s.confidence, 0) / totalSteps) * 100
        )
      : null;
  const avgLatency =
    totalSteps > 0
      ? Math.round(steps.reduce((acc, s) => acc + s.latencyMs, 0) / totalSteps)
      : null;

  if (!isPanelOpen) {
    return (
      <button
        onClick={() => {
          setIsPanelOpen(true);
          onToggle?.();
        }}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3.5 py-2.5 bg-gray-900/90 hover:bg-black text-white dark:bg-purple-950/90 dark:hover:bg-purple-900 border border-purple-500/40 rounded-2xl shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-105 text-xs font-mono"
        title="Open Live Jev Reasoning Trace"
      >
        <Terminal className="w-4 h-4 text-pink-400 animate-pulse" />
        <span>Live Trace</span>
        {totalSteps > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-pink-500 text-[10px] font-bold">
            {totalSteps}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col bg-gray-900/95 dark:bg-[#120c18]/95 border border-purple-500/30 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-xs text-gray-200 font-mono transition-all">
      {/* Panel Top Header */}
      <div className="p-3.5 bg-black/40 border-b border-purple-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-pink-400" />
          <span className="font-bold text-gray-100 tracking-wide">
            Jev Reasoning Trace
          </span>
          <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[10px] border border-pink-500/30">
            Live
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onClear && (
            <button
              onClick={onClear}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              title="Clear Session Trace"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => {
              setIsPanelOpen(false);
              onToggle?.();
            }}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
            title="Minimize Trace Panel"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Running Tally Bar */}
      <div className="grid grid-cols-4 gap-1 p-2.5 bg-black/20 border-b border-purple-500/10 text-[10px] text-center">
        <div className="p-1 rounded bg-white/5">
          <span className="text-gray-400 block text-[9px]">Calls</span>
          <span className="font-bold text-pink-400">{totalSteps}</span>
        </div>
        <div className="p-1 rounded bg-white/5">
          <span className="text-gray-400 block text-[9px]">Acc/Opt</span>
          <span className="font-bold text-emerald-400">
            {accuracyPct !== null ? `${accuracyPct}%` : "-"}
          </span>
        </div>
        <div className="p-1 rounded bg-white/5">
          <span className="text-gray-400 block text-[9px]">Avg Conf</span>
          <span className="font-bold text-purple-300">
            {avgConfidence !== null ? `${avgConfidence}%` : "-"}
          </span>
        </div>
        <div className="p-1 rounded bg-white/5">
          <span className="text-gray-400 block text-[9px]">Avg Lat</span>
          <span className="font-bold text-indigo-300">
            {avgLatency !== null ? `${avgLatency}ms` : "-"}
          </span>
        </div>
      </div>

      {/* Step Logs Scroll Container */}
      <div
        ref={scrollRef}
        className="p-3 space-y-2.5 overflow-y-auto max-h-[480px] min-h-[220px]"
      >
        {steps.length === 0 ? (
          <div className="py-12 text-center text-gray-500 space-y-1">
            <p>No Jev decisions logged in this session.</p>
            <p className="text-[10px] text-gray-600">
              Actions will stream in real time.
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
                className="p-2.5 bg-black/40 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all space-y-1.5"
              >
                {/* Step Top Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                      #{step.stepNumber}
                    </span>
                    <span className="text-gray-300 font-sans font-medium text-[11px]">
                      {step.context}
                    </span>
                  </div>

                  {/* Verdict Badge */}
                  <div>
                    {isPositive ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {step.game === "tictactoe" ? "Optimal" : "Correct"}
                      </span>
                    ) : isNegative ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-semibold">
                        <XCircle className="w-2.5 h-2.5" />
                        {step.game === "tictactoe" ? "Suboptimal" : "Mistake"}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-[10px]">Unverified</span>
                    )}
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Answer:</span>
                    <span className="font-bold text-pink-400 text-xs">
                      {step.choice}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 text-[10px]">
                    <span>{(step.confidence * 100).toFixed(0)}% conf</span>
                    <span>{step.latencyMs} ms</span>
                  </div>
                </div>

                {/* Optimal Moves hint for Tic-Tac-Toe */}
                {step.game === "tictactoe" &&
                  step.isOptimal === false &&
                  step.optimalMoves && (
                    <div className="text-[10px] text-amber-400/90 font-sans">
                      Minimax optimal moves: [{step.optimalMoves.join(", ")}]
                    </div>
                  )}

                {/* Collapsible State/Instructions */}
                {(step.stateSent || step.instructionsSent) && (
                  <div className="pt-1">
                    <button
                      onClick={() => toggleExpand(step.stepNumber)}
                      className="text-[10px] text-gray-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      <span>
                        {isExpanded ? "Hide Prompt / State" : "View Prompt / State"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-1.5 p-2 bg-black/60 rounded-lg border border-white/5 space-y-1.5 text-[10px]">
                        {step.stateSent && (
                          <div>
                            <span className="text-gray-500 block uppercase text-[9px]">
                              State Sent:
                            </span>
                            <pre className="text-gray-300 whitespace-pre-wrap max-h-24 overflow-y-auto">
                              {step.stateSent}
                            </pre>
                          </div>
                        )}
                        {step.instructionsSent && (
                          <div>
                            <span className="text-gray-500 block uppercase text-[9px]">
                              Instructions Sent:
                            </span>
                            <pre className="text-gray-300 whitespace-pre-wrap max-h-20 overflow-y-auto">
                              {step.instructionsSent}
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
    </div>
  );
}
