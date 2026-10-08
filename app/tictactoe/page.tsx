"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Award } from "lucide-react";
import {
  type Board,
  type Player,
  checkWinnerWithLine,
  getEmptyCells,
  formatTicTacToeBoard,
} from "@/lib/tictactoe";
import { useTrace } from "@/context/TraceContext";
import { TraceSidebar } from "@/components/TraceSidebar";
import { useGameLifecycle } from "@/hooks/useGameLifecycle";
import { AbandonConfirmModal } from "@/components/AbandonConfirmModal";

interface JevMoveLog {
  turnNumber: number;
  moveIndex: number;
  symbol: Player;
  confidence: number;
  isOptimal: boolean;
  optimalMoves: number[];
  latencyMs: number;
  probabilities: Record<string, number>;
}

export default function TicTacToePage() {
  const { addTraceStep, endGame, setShowUpgradeModal, fetchSessionAuth } = useTrace();

  const [userSymbol, setUserSymbol] = useState<Player>("X");
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>("X");
  const [isJevThinking, setIsJevThinking] = useState(false);
  const [jevMoveLogs, setJevMoveLogs] = useState<JevMoveLog[]>([]);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const jevSymbol: Player = userSymbol === "X" ? "O" : "X";
  const { winner } = checkWinnerWithLine(board);
  const isGameOver = winner !== null;

  const triggerJevTurn = useCallback(
    async (
      currentBoard: Board,
      currentJevLogs: JevMoveLog[],
      targetJevSymbol: Player,
      targetUserSymbol: Player,
      targetGameId?: string,
      targetSessionId?: string
    ) => {
      // Guard: Do not execute Jev turn if game is already terminal or no empty cells
      const checkRes = checkWinnerWithLine(currentBoard);
      if (checkRes.winner !== null) {
        setWinningLine(checkRes.winningLine);
        return;
      }

      const openCells = getEmptyCells(currentBoard);
      if (openCells.length === 0) {
        return;
      }

      setIsJevThinking(true);
      setErrorMsg(null);

      try {
        const res = await fetch("/api/tictactoe/ask-move", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            board: currentBoard,
            player: targetJevSymbol,
            sessionId: targetSessionId,
            gameId: targetGameId,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: "Request failed" }));
          if (res.status === 403 || errData.error === "FREE_LIMIT_REACHED") {
            setShowUpgradeModal(true);
            await fetchSessionAuth();
            throw new Error("Free trial limit reached (10/10 calls). Please enter your TypeSafe API key to continue.");
          }
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        await fetchSessionAuth();
        let targetIndex = Number(data.choice);

        // Fallback safety: If Jev selected an occupied cell, fallback to first available open cell
        if (currentBoard[targetIndex] !== null) {
          targetIndex = openCells[0];
        }

        const nextBoard = [...currentBoard];
        nextBoard[targetIndex] = targetJevSymbol;

        const newLog: JevMoveLog = {
          turnNumber: currentJevLogs.length + 1,
          moveIndex: targetIndex,
          symbol: targetJevSymbol,
          confidence: data.confidence,
          isOptimal: data.isOptimal ?? false,
          optimalMoves: data.optimalMoves ?? [],
          latencyMs: data.latencyMs,
          probabilities: data.probabilities ?? {},
        };

        // Stream to shared global trace telemetry
        addTraceStep({
          game: "tictactoe",
          context: `Move ${currentJevLogs.length + 1} (Played ${targetJevSymbol} at Cell ${targetIndex})`,
          choice: String(targetIndex),
          confidence: data.confidence,
          latencyMs: data.latencyMs,
          isOptimal: data.isOptimal ?? false,
          optimalMoves: data.optimalMoves ?? [],
          stateSent: formatTicTacToeBoard(currentBoard),
          instructionsSent: data.instructionsSent,
          criteriaSent: data.criteriaSent,
          sessionId: targetSessionId,
          gameId: targetGameId,
        });

        setBoard(nextBoard);
        setJevMoveLogs((prev) => [...prev, newLog]);

        const postJevCheck = checkWinnerWithLine(nextBoard);
        if (postJevCheck.winner !== null) {
          setWinningLine(postJevCheck.winningLine);
          if (postJevCheck.winner === "draw") {
            endGame("draw");
          } else if (postJevCheck.winner === targetUserSymbol) {
            endGame("win");
          } else {
            endGame("loss");
          }
        }

        setTurn(targetUserSymbol);
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error
            ? `Jev move failed: ${err.message}`
            : "Jev move request failed. Please check connection."
        );
      } finally {
        setIsJevThinking(false);
      }
    },
    [addTraceStep, endGame]
  );

  const onResetDisplay = useCallback(
    (newGameId: string) => {
      const emptyBoard: Board = Array(9).fill(null);
      setBoard(emptyBoard);
      setJevMoveLogs([]);
      setWinningLine(null);
      setErrorMsg(null);
      setTurn("X");

      const effectiveJevSymbol: Player = userSymbol === "X" ? "O" : "X";

      // If user plays as O, Jev is X, and X always makes the first move!
      if (userSymbol === "O") {
        triggerJevTurn(emptyBoard, [], effectiveJevSymbol, userSymbol, newGameId);
      }
    },
    [userSymbol, triggerJevTurn]
  );

  const {
    sessionId,
    gameId,
    requestNewGame,
    showAbandonModal,
    confirmAbandon,
    cancelAbandon,
  } = useGameLifecycle({
    gameType: "tictactoe",
    isCompleted: isGameOver,
    callCount: jevMoveLogs.length,
    onResetDisplay,
  });

  // Start initial game on first mount if none active
  useEffect(() => {
    if (!gameId) {
      requestNewGame();
    }
  }, [gameId, requestNewGame]);

  const handleSymbolChange = (newSymbol: Player) => {
    if (newSymbol === userSymbol) return;
    setUserSymbol(newSymbol);
    const emptyBoard: Board = Array(9).fill(null);
    setBoard(emptyBoard);
    setJevMoveLogs([]);
    setWinningLine(null);
    setErrorMsg(null);
    setTurn("X");

    if (newSymbol === "O") {
      triggerJevTurn(emptyBoard, [], "X", "O", gameId || undefined, sessionId);
    }
  };

  const handleCellClick = async (index: number) => {
    // Strict Guard: Prevent double-submission, clicking occupied cells, or clicking during game over
    if (
      board[index] !== null ||
      isGameOver ||
      isJevThinking ||
      turn !== userSymbol
    ) {
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = userSymbol;
    setBoard(nextBoard);

    // Check if user's move caused game over (win or draw)
    const checkRes = checkWinnerWithLine(nextBoard);
    if (checkRes.winner !== null) {
      setWinningLine(checkRes.winningLine);
      if (checkRes.winner === "draw") {
        endGame("draw");
      } else if (checkRes.winner === userSymbol) {
        endGame("win");
      } else {
        endGame("loss");
      }
      return;
    }

    setTurn(jevSymbol);
    await triggerJevTurn(
      nextBoard,
      jevMoveLogs,
      jevSymbol,
      userSymbol,
      gameId || undefined,
      sessionId
    );
  };

  const latestJevMove = jevMoveLogs.length > 0 ? jevMoveLogs[jevMoveLogs.length - 1] : null;
  const optimalCount = jevMoveLogs.filter((log) => log.isOptimal).length;
  const totalJevMoves = jevMoveLogs.length;

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs px-2.5 py-1 rounded-md bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
            >
              ← Arcade Home
            </Link>
            <span className="text-xs text-pink-600 dark:text-pink-400 font-mono tracking-wide uppercase bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
              System One Jev
            </span>
            {gameId && (
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                Game ID: {gameId}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mt-1">
            Tic-Tac-Toe Arena
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Play against Jev&apos;s raw neural intuition with deterministic tactical heuristics and live reasoning telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Symbol Selector */}
          <div className="flex items-center bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 text-xs shadow-sm">
            <button
              onClick={() => handleSymbolChange("X")}
              disabled={isJevThinking}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                userSymbol === "X"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Play as X (1st)
            </button>
            <button
              onClick={() => handleSymbolChange("O")}
              disabled={isJevThinking}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                userSymbol === "O"
                  ? "bg-pink-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Play as O (2nd)
            </button>
          </div>

          <button
            onClick={requestNewGame}
            disabled={isJevThinking}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Game</span>
          </button>
        </div>
      </header>

      {/* Error Alert */}
      {errorMsg && (
        <div className="w-full max-w-7xl mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Game Area (~68%) */}
        <div className="flex-1 w-full flex flex-col items-center">
          {/* Game Status Banner */}
          <div className="w-full max-w-md mb-6 p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  isGameOver
                    ? "bg-gray-400"
                    : isJevThinking
                    ? "bg-amber-400 animate-ping"
                    : turn === userSymbol
                    ? "bg-emerald-500"
                    : "bg-purple-500"
                }`}
              />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {isGameOver
                    ? "Match Concluded"
                    : isJevThinking
                    ? "Jev is computing..."
                    : turn === userSymbol
                    ? "Your Turn"
                    : "Jev's Turn"}
                </div>
                <div className="text-base font-bold text-gray-900 dark:text-white">
                  {isGameOver ? (
                    winner === "draw" ? (
                      <span className="text-amber-500">Stalemate (Draw)</span>
                    ) : winner === userSymbol ? (
                      <span className="text-emerald-500">Victory! You Won 🎉</span>
                    ) : (
                      <span className="text-pink-500">Jev Won! 🤖</span>
                    )
                  ) : isJevThinking ? (
                    <span className="text-amber-500 flex items-center gap-1.5">
                      Thinking...
                    </span>
                  ) : turn === userSymbol ? (
                    <span>Make your move ({userSymbol})</span>
                  ) : (
                    <span>Jev is playing {jevSymbol}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Turn symbol badge */}
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block uppercase font-mono">You / Jev</span>
              <span className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                {userSymbol} <span className="text-gray-400 font-normal">vs</span> {jevSymbol}
              </span>
            </div>
          </div>

          {/* 3x3 Tic-Tac-Toe Grid */}
          <div className="relative p-4 bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl">
            <div className="grid grid-cols-3 gap-3 w-[300px] h-[300px] sm:w-[360px] sm:h-[360px]">
              {board.map((cell, idx) => {
                const isWinningCell = winningLine?.includes(idx);
                const isClickable =
                  cell === null && !isGameOver && !isJevThinking && turn === userSymbol;

                return (
                  <button
                    key={idx}
                    onClick={() => handleCellClick(idx)}
                    disabled={!isClickable}
                    className={`relative rounded-2xl flex items-center justify-center font-bold text-4xl sm:text-5xl transition-all duration-200 select-none ${
                      cell === null
                        ? isClickable
                          ? "bg-gray-100/80 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:scale-[1.02] active:scale-95 cursor-pointer border border-dashed border-gray-300 dark:border-white/10 hover:border-purple-400"
                          : "bg-gray-100/50 dark:bg-white/5 opacity-60 cursor-not-allowed border border-transparent"
                        : cell === "X"
                        ? "bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 shadow-sm"
                        : "bg-pink-500/10 border border-pink-500/30 text-pink-600 dark:text-pink-400 shadow-sm"
                    } ${
                      isWinningCell
                        ? "!border-emerald-500 !bg-emerald-500/20 ring-4 ring-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105 z-10 animate-pulse"
                        : ""
                    }`}
                  >
                    {cell}
                    {isWinningCell && (
                      <span className="absolute bottom-1 text-[9px] font-sans font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-white/90 dark:bg-black/90 px-1.5 py-0.2 rounded-full shadow">
                        WIN LINE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inline Move Telemetry Note */}
          {latestJevMove && !isGameOver && (
            <div className="w-full max-w-md mt-6 p-4 rounded-2xl bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-900/40 shadow-sm flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  Last Jev Move:
                </span>
                <span className="font-mono bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded text-purple-700 dark:text-purple-300 font-bold">
                  Cell #{latestJevMove.moveIndex}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  ({Math.round(latestJevMove.confidence * 100)}% conf, {latestJevMove.latencyMs}ms)
                </span>
              </div>
              <div>
                {latestJevMove.isOptimal ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ✓ Optimal
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    ✕ Suboptimal
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Game Over Summary Card */}
          {isGameOver && (
            <div className="w-full max-w-md mt-6 p-6 rounded-3xl bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-indigo-900/20 border border-purple-500/30 backdrop-blur-xl shadow-2xl text-center">
              <Award className="w-12 h-12 mx-auto text-purple-400 mb-2" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Match Finished
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {winner === "draw"
                  ? "It's a draw! Both sides played resiliently."
                  : winner === userSymbol
                  ? `Congratulations! You defeated Jev as ${userSymbol}!`
                  : `Jev won this match as ${jevSymbol}.`}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-purple-500/20 text-left text-xs">
                <div className="bg-white/50 dark:bg-black/30 p-3 rounded-xl">
                  <div className="text-gray-500 dark:text-gray-400">Jev Optimality:</div>
                  <div className="text-base font-bold text-purple-600 dark:text-purple-300 font-mono mt-0.5">
                    {optimalCount} / {totalJevMoves} moves
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {totalJevMoves > 0
                      ? `${Math.round((optimalCount / totalJevMoves) * 100)}% optimal per minimax`
                      : "0 moves"}
                  </div>
                </div>

                <div className="bg-white/50 dark:bg-black/30 p-3 rounded-xl">
                  <div className="text-gray-500 dark:text-gray-400">Avg Jev Latency:</div>
                  <div className="text-base font-bold text-pink-600 dark:text-pink-300 font-mono mt-0.5">
                    {totalJevMoves > 0
                      ? `${Math.round(
                          jevMoveLogs.reduce((acc, m) => acc + m.latencyMs, 0) / totalJevMoves
                        )}ms`
                      : "—"}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Per decision query
                  </div>
                </div>
              </div>

              <button
                onClick={requestNewGame}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow hover:from-purple-500 hover:to-pink-500 transition-all cursor-pointer text-xs"
              >
                Play Another Match
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Dedicated Jev Reasoning Trace (~32%) */}
        <div className="w-full lg:w-[360px] xl:w-[420px] shrink-0 sticky top-20">
          <TraceSidebar />
        </div>
      </div>

      {/* Abandon In-Progress Game Confirmation Modal */}
      <AbandonConfirmModal
        isOpen={showAbandonModal}
        onConfirm={confirmAbandon}
        onCancel={cancelAbandon}
        gameType="tictactoe"
      />
    </div>
  );
}
