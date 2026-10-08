"use client";

import { useState, useCallback } from "react";
import { useTrace } from "@/context/TraceContext";

interface UseGameLifecycleOptions {
  gameType: "tictactoe" | "sudoku" | string;
  isCompleted: boolean;
  callCount: number;
  onResetDisplay: (newGameId: string) => void;
}

export function useGameLifecycle({
  gameType,
  isCompleted,
  callCount,
  onResetDisplay,
}: UseGameLifecycleOptions) {
  const { sessionId, gameId, startNewGame, endGame, clearTrace } = useTrace();
  const [showAbandonModal, setShowAbandonModal] = useState(false);

  /**
   * Main action triggered when clicking "New Game" / "New Puzzle".
   */
  const requestNewGame = useCallback(() => {
    // 1. IF CURRENT GAME IS EMPTY (zero Jev calls made) -> silently discard & delete row
    if (callCount === 0 && gameId) {
      fetch(`/api/games?id=${encodeURIComponent(gameId)}`, {
        method: "DELETE",
      }).catch((err) => console.error("Failed to discard empty game:", err));

      clearTrace();
      const newId = startNewGame(gameType);
      onResetDisplay(newId);
      return;
    }

    // 2. IF CURRENT GAME IS COMPLETED -> clear display and start fresh game
    if (isCompleted) {
      clearTrace();
      const newId = startNewGame(gameType);
      onResetDisplay(newId);
      return;
    }

    // 3. IF CURRENT GAME IS IN PROGRESS (at least 1 call, not completed) -> show confirmation modal
    setShowAbandonModal(true);
  }, [callCount, gameId, isCompleted, gameType, clearTrace, startNewGame, onResetDisplay]);

  /**
   * User confirmed abandoning the in-progress game.
   */
  const confirmAbandon = useCallback(async () => {
    setShowAbandonModal(false);

    if (gameId) {
      await endGame("abandoned");
    }

    clearTrace();
    const newId = startNewGame(gameType);
    onResetDisplay(newId);
  }, [gameId, endGame, clearTrace, startNewGame, gameType, onResetDisplay]);

  const cancelAbandon = useCallback(() => {
    setShowAbandonModal(false);
  }, []);

  return {
    sessionId,
    gameId,
    requestNewGame,
    showAbandonModal,
    confirmAbandon,
    cancelAbandon,
  };
}
