"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { getOrCreateSessionId, generateGameId } from "@/lib/session";

export interface TraceStep {
  id?: string;
  stepNumber: number;
  game: "sudoku" | "tictactoe" | string;
  context: string;
  choice: string;
  confidence: number;
  latencyMs: number;
  isCorrect?: boolean | null;
  isOptimal?: boolean | null;
  optimalMoves?: number[];
  stateSent?: string;
  instructionsSent?: string;
  criteriaSent?: Record<string, string | null>;
  timestamp?: string;
  sessionId?: string;
  gameId?: string;
}

interface TraceContextType {
  sessionId: string;
  gameId: string | null;
  authMode: "free" | "byok" | null;
  remainingCalls: number | null;
  freeCallsUsed: number;
  fetchSessionAuth: () => Promise<void>;
  setByokKey: (key: string) => Promise<{ success: boolean; error?: string }>;
  setFreeMode: () => Promise<{ success: boolean; isRepeatTrial?: boolean }>;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  decrementFreeCall: () => void;
  startNewGame: (gameType: "tictactoe" | "sudoku" | string) => string;
  endGame: (result: "win" | "loss" | "draw" | "completed" | "abandoned") => Promise<void>;
  steps: TraceStep[];
  addTraceStep: (step: Omit<TraceStep, "stepNumber">) => void;
  clearTrace: () => void;
  terminateSession: () => Promise<void>;
  totalSteps: number;
  accuracyPct: number | null;
  avgConfidence: number | null;
  avgLatency: number | null;
}

const TraceContext = createContext<TraceContextType | undefined>(undefined);

export function TraceProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string>("");
  const [gameId, setGameId] = useState<string | null>(null);
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [authMode, setAuthMode] = useState<"free" | "byok" | null>(null);
  const [remainingCalls, setRemainingCalls] = useState<number | null>(10);
  const [freeCallsUsed, setFreeCallsUsed] = useState<number>(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  const fetchSessionAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setAuthMode(data.mode);
        setRemainingCalls(data.remainingCalls);
        setFreeCallsUsed(data.freeCallsUsed);
      }
    } catch (err) {
      console.error("Failed to fetch session auth:", err);
    }
  }, []);

  // Initialize session ID and fetch auth state on mount
  useEffect(() => {
    const id = getOrCreateSessionId();
    setSessionId(id);
    fetchSessionAuth();
  }, [fetchSessionAuth]);

  const setByokKey = useCallback(
    async (apiKey: string) => {
      const currentSessionId = sessionId || getOrCreateSessionId();
      try {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "byok",
            apiKey,
            sessionId: currentSessionId,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setAuthMode("byok");
          setRemainingCalls(null);
          return { success: true };
        }
        return { success: false, error: data.error || "Validation failed" };
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Connection failed",
        };
      }
    },
    [sessionId]
  );

  const setFreeMode = useCallback(async () => {
    const currentSessionId = sessionId || getOrCreateSessionId();
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "free",
          sessionId: currentSessionId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthMode("free");
        setRemainingCalls(data.remainingCalls ?? 10);
        return { success: true, isRepeatTrial: data.isRepeatTrial };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  }, [sessionId]);

  const decrementFreeCall = useCallback(() => {
    setRemainingCalls((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    setFreeCallsUsed((prev) => prev + 1);
  }, []);

  const startNewGame = useCallback(
    (gameType: string) => {
      const newGId = generateGameId();
      setGameId(newGId);

      const currentSessionId = sessionId || getOrCreateSessionId();
      if (!sessionId) setSessionId(currentSessionId);

      // Async report to server
      fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newGId,
          sessionId: currentSessionId,
          gameType,
        }),
      }).catch((err) => console.error("Failed to register new game:", err));

      return newGId;
    },
    [sessionId]
  );

  const endGame = useCallback(
    async (result: "win" | "loss" | "draw" | "completed" | "abandoned") => {
      if (!gameId) return;
      try {
        await fetch("/api/games", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: gameId,
            result,
          }),
        });
      } catch (err) {
        console.error("Failed to update game outcome:", err);
      }
    },
    [gameId]
  );

  const addTraceStep = useCallback(
    (stepData: Omit<TraceStep, "stepNumber">) => {
      setSteps((prev) => {
        const nextStepNum = prev.length + 1;
        const newStep: TraceStep = {
          ...stepData,
          stepNumber: nextStepNum,
          timestamp: stepData.timestamp || new Date().toLocaleTimeString(),
          sessionId: stepData.sessionId || sessionId,
          gameId: stepData.gameId || gameId || undefined,
        };
        return [...prev, newStep];
      });
    },
    [sessionId, gameId]
  );

  const clearTrace = useCallback(() => {
    setSteps([]);
  }, []);

  const terminateSession = useCallback(async () => {
    const currentSessionId = sessionId || getOrCreateSessionId();
    try {
      await fetch("/api/session/terminate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          gameId: gameId || undefined,
        }),
      });
    } catch (err) {
      console.error("Failed to terminate session on server:", err);
    }

    // Clear client storage and memory
    const { clearSession } = await import("@/lib/session");
    clearSession();
    setSteps([]);
    setGameId(null);
    setSessionId("");
    window.location.href = "/";
  }, [sessionId, gameId]);

  // Compute live running tallies
  const totalSteps = steps.length;
  const verifiedSteps = steps.filter(
    (s) =>
      (s.isCorrect !== undefined && s.isCorrect !== null) ||
      (s.isOptimal !== undefined && s.isOptimal !== null)
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

  return (
    <TraceContext.Provider
      value={{
        sessionId,
        gameId,
        authMode,
        remainingCalls,
        freeCallsUsed,
        fetchSessionAuth,
        setByokKey,
        setFreeMode,
        showUpgradeModal,
        setShowUpgradeModal,
        decrementFreeCall,
        startNewGame,
        endGame,
        steps,
        addTraceStep,
        clearTrace,
        terminateSession,
        totalSteps,
        accuracyPct,
        avgConfidence,
        avgLatency,
      }}
    >
      {children}
    </TraceContext.Provider>
  );
}

export function useTrace() {
  const context = useContext(TraceContext);
  if (!context) {
    throw new Error("useTrace must be used within a TraceProvider");
  }
  return context;
}
