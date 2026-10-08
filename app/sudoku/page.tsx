"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  AlertCircle,
  RotateCcw,
  Play,
  Square,
  Zap,
} from "lucide-react";
import { isFullValidSudoku, getSudokuViolations, type SudokuViolations } from "@/lib/sudoku";
import { useTrace } from "@/context/TraceContext";
import { TraceSidebar } from "@/components/TraceSidebar";
import { useGameLifecycle } from "@/hooks/useGameLifecycle";
import { AbandonConfirmModal } from "@/components/AbandonConfirmModal";
import { SudokuGridSkeleton } from "@/components/SudokuGridSkeleton";

interface CellResult {
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
  latencyMs: number;
  isCorrect: boolean;
}

interface PuzzleInfo {
  id: number | string;
  difficulty: "easy" | "medium" | "hard" | "random";
  source: "verified_bank" | "live_generator";
}

export default function SudokuPage() {
  const { addTraceStep, endGame, setShowUpgradeModal, fetchSessionAuth } = useTrace();

  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "random">("easy");
  const [puzzleInfo, setPuzzleInfo] = useState<PuzzleInfo | null>(null);
  const [initialPuzzle, setInitialPuzzle] = useState<number[][] | null>(null);
  const [workingPuzzle, setWorkingPuzzle] = useState<number[][] | null>(null);
  const [solution, setSolution] = useState<number[][] | null>(null);
  const [initialGivens, setInitialGivens] = useState<boolean[][] | null>(null);
  const [evaluatedCells, setEvaluatedCells] = useState<Record<string, CellResult>>({});
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [loadingCell, setLoadingCell] = useState<{ row: number; col: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-complete state
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const [autoCompleteProgress, setAutoCompleteProgress] = useState<{ current: number; total: number } | null>(null);
  const [violations, setViolations] = useState<SudokuViolations | null>(null);
  const [autoCompleteSummary, setAutoCompleteSummary] = useState<{
    totalSolved: number;
    correctVsSolution: number;
    isBoardGloballyValid: boolean;
    violations: SudokuViolations;
  } | null>(null);

  const abortControllerRef = useRef<boolean>(false);

  // Derived states
  const totalEmptyCells = initialGivens
    ? initialGivens.flat().filter((isGiven) => !isGiven).length
    : 0;
  const evaluatedCount = Object.keys(evaluatedCells).length;
  const correctCount = Object.values(evaluatedCells).filter((c) => c.isCorrect).length;
  const isPuzzleComplete = totalEmptyCells > 0 && evaluatedCount >= totalEmptyCells;

  const loadPuzzleGrid = useCallback(
    async (diff = difficulty) => {
      setIsGenerating(true);
      setErrorMsg(null);
      setSelectedCell(null);
      setEvaluatedCells({});
      setAutoCompleteSummary(null);
      setViolations(null);
      setIsAutoCompleting(false);
      abortControllerRef.current = false;

      try {
        const res = await fetch(`/api/sudoku/new?difficulty=${diff}`);
        if (!res.ok) throw new Error("Failed to load puzzle");
        const data = await res.json();

        setPuzzleInfo({
          id: data.id,
          difficulty: data.difficulty,
          source: data.source,
        });
        setInitialPuzzle(data.puzzle);
        setWorkingPuzzle(data.puzzle.map((row: number[]) => [...row]));
        setSolution(data.solution);

        const givens: boolean[][] = data.puzzle.map((row: number[]) =>
          row.map((cell: number) => cell !== 0)
        );
        setInitialGivens(givens);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Error loading puzzle");
      } finally {
        setIsGenerating(false);
      }
    },
    [difficulty]
  );

  const onResetDisplay = useCallback(
    (newGameId: string) => {
      loadPuzzleGrid(difficulty);
    },
    [difficulty, loadPuzzleGrid]
  );

  const {
    sessionId,
    gameId,
    requestNewGame,
    showAbandonModal,
    confirmAbandon,
    cancelAbandon,
  } = useGameLifecycle({
    gameType: "sudoku",
    isCompleted: isPuzzleComplete,
    callCount: evaluatedCount,
    onResetDisplay,
  });

  useEffect(() => {
    if (!gameId) {
      requestNewGame();
    } else if (!workingPuzzle) {
      loadPuzzleGrid(difficulty);
    }
  }, [gameId, workingPuzzle, difficulty, requestNewGame, loadPuzzleGrid]);

  // Handle single manual cell click
  const handleCellClick = async (row: number, col: number) => {
    if (!workingPuzzle || !solution || !initialGivens || isAutoCompleting) return;

    if (loadingCell !== null) return;

    // Given cell
    if (initialGivens[row][col]) {
      setSelectedCell({ row, col });
      return;
    }

    const cellKey = `${row}-${col}`;
    setSelectedCell({ row, col });

    // If already answered, only inspect the cached result
    if (evaluatedCells[cellKey]) {
      return;
    }

    setLoadingCell({ row, col });
    setErrorMsg(null);

    try {
      const res = await fetch("/api/sudoku/ask-cell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzle: workingPuzzle,
          solution,
          row,
          col,
          mode: "manual",
          difficulty: puzzleInfo?.difficulty,
          sessionId,
          gameId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Request failed" }));
        if (res.status === 403 || errorData.error === "FREE_LIMIT_REACHED") {
          setShowUpgradeModal(true);
          await fetchSessionAuth();
          throw new Error("Free trial limit reached (10/10 calls). Please enter your TypeSafe API key to continue.");
        }
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const result: CellResult = await res.json();
      await fetchSessionAuth();

      setEvaluatedCells((prev) => ({
        ...prev,
        [cellKey]: result,
      }));

      // Stream to shared global trace telemetry
      addTraceStep({
        game: "sudoku",
        context: `Cell R${row + 1},C${col + 1} (Manual Click)`,
        choice: result.choice,
        confidence: result.confidence,
        latencyMs: result.latencyMs,
        isCorrect: result.isCorrect,
        stateSent: `Target: Row ${row + 1}, Col ${col + 1} on active 9x9 grid`,
        instructionsSent: `What digit (1-9) belongs at Row ${row + 1}, Column ${col + 1}? Must satisfy row, col, and 3x3 box uniqueness.`,
      });

      // Feed Jev's answer into the working grid
      setWorkingPuzzle((prev) => {
        if (!prev) return prev;
        const next = prev.map((r) => [...r]);
        next[row][col] = Number(result.choice);
        return next;
      });
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Jev evaluation failed. Please check connection and try again."
      );
    } finally {
      setLoadingCell(null);
    }
  };

  // Auto-Complete with Jev: sequential solve with feedback loop
  const handleAutoComplete = async () => {
    if (!workingPuzzle || !solution || !initialGivens || isAutoCompleting) return;

    // Collect all currently empty cells
    const emptyCells: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!initialGivens[r][c] && !evaluatedCells[`${r}-${c}`]) {
          emptyCells.push({ row: r, col: c });
        }
      }
    }

    if (emptyCells.length === 0) return;

    setIsAutoCompleting(true);
    abortControllerRef.current = false;
    setAutoCompleteSummary(null);
    setViolations(null);
    setErrorMsg(null);

    let currentWorking = workingPuzzle.map((r) => [...r]);
    const totalToSolve = emptyCells.length;
    let solvedCount = 0;
    let correctCountAcc = Object.values(evaluatedCells).filter((c) => c.isCorrect).length;

    for (let i = 0; i < emptyCells.length; i++) {
      if (abortControllerRef.current) {
        break;
      }

      const { row, col } = emptyCells[i];
      const cellKey = `${row}-${col}`;
      setSelectedCell({ row, col });
      setLoadingCell({ row, col });
      setAutoCompleteProgress({ current: i + 1, total: totalToSolve });

      try {
        const res = await fetch("/api/sudoku/ask-cell", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            puzzle: currentWorking, // feeds Jev's OWN accumulated answers
            solution,
            row,
            col,
            mode: "autocomplete",
            difficulty: puzzleInfo?.difficulty,
            stepIndex: i + 1,
            sessionId,
            gameId,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Request failed" }));
          if (res.status === 403 || errorData.error === "FREE_LIMIT_REACHED") {
            setShowUpgradeModal(true);
            await fetchSessionAuth();
            throw new Error("Free trial limit reached (10/10 calls). Please enter your TypeSafe API key to continue.");
          }
          throw new Error(errorData.error || `HTTP ${res.status} on cell (${row}, ${col})`);
        }

        const result: CellResult = await res.json();
        await fetchSessionAuth();

        setEvaluatedCells((prev) => ({
          ...prev,
          [cellKey]: result,
        }));

        // Stream to shared global trace telemetry
        addTraceStep({
          game: "sudoku",
          context: `Cell R${row + 1},C${col + 1} (Autocomplete #${i + 1})`,
          choice: result.choice,
          confidence: result.confidence,
          latencyMs: result.latencyMs,
          isCorrect: result.isCorrect,
          stateSent: `Sequential step ${i + 1}/${totalToSolve} incorporating prior answers into live grid`,
          instructionsSent: `What digit (1-9) belongs at Row ${row + 1}, Column ${col + 1}? Must satisfy row, col, and 3x3 box uniqueness.`,
        });

        // Update working grid in place
        currentWorking[row][col] = Number(result.choice);
        setWorkingPuzzle(currentWorking.map((r) => [...r]));

        solvedCount++;
        if (result.isCorrect) {
          correctCountAcc++;
        }

        // Brief delay between steps for smooth live visual progression
        await new Promise((resolve) => setTimeout(resolve, 80));
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error
            ? `Auto-solve error at cell (${row + 1}, ${col + 1}): ${err.message}`
            : "Auto-solve encountered an error."
        );
        break;
      }
    }

    setLoadingCell(null);
    setIsAutoCompleting(false);
    setAutoCompleteProgress(null);

    // Run full duplicate and validation check on the final board
    const currentViolations = getSudokuViolations(currentWorking);
    setViolations(currentViolations);

    const isGloballyValid = isFullValidSudoku(currentWorking);

    setAutoCompleteSummary({
      totalSolved: solvedCount,
      correctVsSolution: correctCountAcc,
      isBoardGloballyValid: isGloballyValid,
      violations: currentViolations,
    });
  };

  const handleStopAutoComplete = () => {
    abortControllerRef.current = true;
    setIsAutoCompleting(false);
  };

  const selectedCellKey = selectedCell ? `${selectedCell.row}-${selectedCell.col}` : null;
  const selectedResult = selectedCellKey ? evaluatedCells[selectedCellKey] : null;
  const isSelectedGiven =
    selectedCell && initialGivens ? initialGivens[selectedCell.row][selectedCell.col] : false;
  const isSelectedLoading =
    loadingCell && selectedCell
      ? loadingCell.row === selectedCell.row && loadingCell.col === selectedCell.col
      : false;

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
            {puzzleInfo && (
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                Source: {puzzleInfo.source === "verified_bank" ? "Verified Bank" : "Generator"} (#{puzzleInfo.id})
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mt-1">
            Sudoku Neural Benchmark
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Click any cell to query Jev&apos;s raw single-step judgment, or run auto-complete to observe sequential compounding errors.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Difficulty Dropdown */}
          <div className="flex items-center bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 text-xs shadow-sm">
            {(["easy", "medium", "hard", "random"] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => {
                  if (diff === difficulty) return;
                  setDifficulty(diff);
                  if (evaluatedCount === 0 || isPuzzleComplete) {
                    loadPuzzleGrid(diff);
                  } else {
                    requestNewGame();
                  }
                }}
                disabled={isGenerating || isAutoCompleting}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                  difficulty === diff
                    ? "bg-purple-600 text-white shadow-sm font-bold"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          <button
            onClick={requestNewGame}
            disabled={isGenerating || isAutoCompleting}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>New Puzzle</span>
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

      {/* Auto-Complete Summary Banner */}
      {autoCompleteSummary && (
        <div className="w-full max-w-7xl mb-6 p-6 bg-gradient-to-r from-purple-900/10 via-pink-900/10 to-indigo-900/10 dark:from-purple-950/40 dark:via-pink-950/40 dark:to-indigo-950/40 border border-pink-500/30 rounded-2xl shadow-xl backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                Auto-Complete Run Complete
              </h2>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                Jev solved {autoCompleteSummary.totalSolved} cells sequentially.
              </p>
              <div className="flex flex-wrap gap-4 text-xs pt-1">
                <div className="p-2.5 bg-white dark:bg-black/40 rounded-xl border border-gray-200 dark:border-white/10">
                  <span className="text-gray-500 block">Matched Canonical Solution</span>
                  <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {autoCompleteSummary.correctVsSolution} / {autoCompleteSummary.totalSolved}{" "}
                    ({Math.round((autoCompleteSummary.correctVsSolution / autoCompleteSummary.totalSolved) * 100)}%)
                  </span>
                </div>
                <div className="p-2.5 bg-white dark:bg-black/40 rounded-xl border border-gray-200 dark:border-white/10">
                  <span className="text-gray-500 block">Full Grid Validity (No Violations)</span>
                  <span
                    className={`text-base font-bold font-mono ${
                      autoCompleteSummary.isBoardGloballyValid
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {autoCompleteSummary.isBoardGloballyValid ? "✓ Valid Solved Board" : "✗ Rule Violations Present"}
                  </span>
                </div>
              </div>
              {!autoCompleteSummary.isBoardGloballyValid && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-amber-600 dark:text-amber-300">
                    <strong>Compounding Error Detected:</strong> When Jev makes an early suboptimal guess, subsequent cells inherit that constraint, showing the limits of pure feed-forward System One logic without explicit backtracking.
                  </p>

                  {autoCompleteSummary.violations && autoCompleteSummary.violations.hasViolations && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs space-y-1.5 text-red-700 dark:text-red-300 font-mono">
                      <div className="font-bold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Rule Duplicate Breakdown ({autoCompleteSummary.violations.totalDuplicatesCount} violations):</span>
                      </div>
                      {autoCompleteSummary.violations.rowDuplicates.map((rd) => (
                        <div key={`row-${rd.row}`}>
                          • Row {rd.row + 1}: duplicate digit(s) [{rd.duplicateValues.join(", ")}]
                        </div>
                      ))}
                      {autoCompleteSummary.violations.colDuplicates.map((cd) => (
                        <div key={`col-${cd.col}`}>
                          • Column {cd.col + 1}: duplicate digit(s) [{cd.duplicateValues.join(", ")}]
                        </div>
                      ))}
                      {autoCompleteSummary.violations.boxDuplicates.map((bd) => (
                        <div key={`box-${bd.boxRow}-${bd.boxCol}`}>
                          • 3x3 Box (Row Block {bd.boxRow + 1}, Col Block {bd.boxCol + 1}): duplicate digit(s) [{bd.duplicateValues.join(", ")}]
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={requestNewGame}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer whitespace-nowrap"
            >
              Next Puzzle →
            </button>
          </div>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Game Board & Cell Inspector (~68%) */}
        <div className="flex-1 w-full flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* 9x9 Sudoku Board */}
            <div className="md:col-span-7 flex flex-col items-center">
              {/* Action Bar Above Board */}
              <div className="w-full flex items-center justify-between mb-3 px-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {isAutoCompleting ? (
                    <span className="text-pink-600 dark:text-pink-400 font-medium flex items-center gap-1.5 animate-pulse">
                      <Zap className="w-3.5 h-3.5" />
                      Auto-solving cell {autoCompleteProgress?.current} of {autoCompleteProgress?.total}...
                    </span>
                  ) : (
                    <span>Click an empty cell or run Auto-Complete</span>
                  )}
                </div>

                {/* Auto-Complete Trigger Buttons */}
                <div>
                  {isAutoCompleting ? (
                    <button
                      onClick={handleStopAutoComplete}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleAutoComplete}
                      disabled={isGenerating || isPuzzleComplete}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Let Jev Solve the Rest</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 9x9 Grid Board Container */}
              <div className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl backdrop-blur-md">
                {workingPuzzle ? (
                  <div className="grid grid-cols-9 bg-gray-100 dark:bg-[#17121b] border-2 border-purple-500/40 rounded-xl overflow-hidden select-none">
                    {workingPuzzle.map((row, r) =>
                      row.map((cellVal, c) => {
                        const isGiven = initialGivens ? initialGivens[r][c] : false;
                        const cellKey = `${r}-${c}`;
                        const evaluated = evaluatedCells[cellKey];
                        const isLoading = loadingCell?.row === r && loadingCell?.col === c;
                        const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                        const isBoardBlocked = loadingCell !== null && !isAutoCompleting;

                        // Check if cell is in violation
                        const isCellInViolation =
                          violations &&
                          cellVal !== 0 &&
                          (violations.rowDuplicates.some((rd) => rd.row === r && rd.duplicateValues.includes(cellVal)) ||
                            violations.colDuplicates.some((cd) => cd.col === c && cd.duplicateValues.includes(cellVal)) ||
                            violations.boxDuplicates.some(
                              (bd) =>
                                bd.boxRow === Math.floor(r / 3) &&
                                bd.boxCol === Math.floor(c / 3) &&
                                bd.duplicateValues.includes(cellVal)
                            ));

                        // Box boundary borders
                        const borderRight =
                          c % 3 === 2 && c !== 8
                            ? "border-r-2 border-r-purple-500/50"
                            : "border-r border-r-gray-300 dark:border-r-white/10";
                        const borderBottom =
                          r % 3 === 2 && r !== 8
                            ? "border-b-2 border-b-purple-500/50"
                            : "border-b border-b-gray-300 dark:border-b-white/10";

                        let bgClass = "bg-white dark:bg-[#17121b] hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer";
                        let textClass = "text-gray-900 dark:text-white";

                        if (isGiven) {
                          bgClass =
                            "bg-gray-200/80 dark:bg-[#110d15] text-gray-500 dark:text-gray-400 font-bold cursor-default hover:bg-gray-200/80 dark:hover:bg-[#110d15]";
                          textClass = "text-gray-600 dark:text-gray-300 font-semibold";
                        } else if (isLoading) {
                          bgClass = "bg-purple-200/60 dark:bg-purple-900/50 animate-pulse";
                        } else if (evaluated) {
                          if (evaluated.isCorrect) {
                            bgClass =
                              "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/40";
                            textClass = "text-emerald-600 dark:text-emerald-400 font-bold";
                          } else {
                            bgClass =
                              "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/40";
                            textClass = "text-rose-600 dark:text-rose-400 font-bold";
                          }
                        }

                        if (isCellInViolation) {
                          bgClass += " ring-2 ring-red-500 ring-inset bg-red-100/60 dark:bg-red-950/60";
                        }

                        if (isSelected) {
                          bgClass += " ring-2 ring-pink-500 ring-inset z-10";
                        }

                        return (
                          <button
                            key={cellKey}
                            onClick={() => handleCellClick(r, c)}
                            disabled={isLoading || isBoardBlocked || isAutoCompleting}
                            className={`w-8 h-8 sm:w-11 sm:h-11 flex flex-col items-center justify-center transition-colors relative font-mono text-sm sm:text-base ${borderRight} ${borderBottom} ${bgClass}`}
                            title={
                              isGiven
                                ? `Given: ${initialPuzzle?.[r][c]}`
                                : isCellInViolation
                                ? `Rule Violation: Duplicate ${cellVal} in row, column, or 3x3 box!`
                                : evaluated
                                ? `Jev Answer: ${evaluated.choice} (${(evaluated.confidence * 100).toFixed(0)}% conf) - ${
                                    evaluated.isCorrect ? "Matches Canonical Solution" : "Different from Canonical"
                                  }`
                                : `Empty cell (Row ${r + 1}, Col ${c + 1})`
                            }
                          >
                            {isLoading ? (
                              <div className="w-3.5 h-3.5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                            ) : isGiven ? (
                              <span>{initialPuzzle?.[r][c]}</span>
                            ) : evaluated ? (
                              <div className="flex flex-col items-center leading-none">
                                <span className={textClass}>{evaluated.choice}</span>
                                <span className="text-[8px] sm:text-[9px] font-sans opacity-75">
                                  {(evaluated.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600 text-xs hover:text-gray-600 dark:hover:text-gray-300">•</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <SudokuGridSkeleton />
                )}
              </div>

              {/* Quick stats footer */}
              <div className="flex items-center gap-6 mt-4 text-xs text-gray-500 dark:text-gray-400">
                <div>
                  Progress:{" "}
                  <span className="text-gray-900 dark:text-white font-mono font-semibold">
                    {evaluatedCount} / {totalEmptyCells} cells
                  </span>
                </div>
                <div>
                  Correct:{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    {correctCount} / {evaluatedCount} {evaluatedCount > 0 ? `(${Math.round((correctCount / evaluatedCount) * 100)}%)` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Jev Response & Inspector Card */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="p-5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl backdrop-blur-md">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                  Cell Inspection & Verdict
                </h2>

                {isSelectedLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-pink-600 dark:text-pink-300 font-medium text-sm animate-pulse">Jev is thinking...</p>
                    <p className="text-xs text-gray-500">Evaluating constraint satisfaction probabilities</p>
                  </div>
                ) : selectedCell ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Selected: </span>
                        <span className="font-mono text-gray-900 dark:text-white font-semibold">
                          Row {selectedCell.row + 1}, Col {selectedCell.col + 1}
                        </span>
                      </div>
                      <div className="text-xs">
                        {isSelectedGiven ? (
                          <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            Original Clue
                          </span>
                        ) : selectedResult ? (
                          selectedResult.isCorrect ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-medium">
                              ✓ Correct
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-medium">
                              ✗ Mismatch
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300">
                            Empty Cell
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelectedGiven ? (
                      <div className="py-6 text-center text-gray-500 text-sm">
                        <p>This cell is an original clue ({initialPuzzle?.[selectedCell.row][selectedCell.col]}).</p>
                        <p className="text-xs text-gray-400 mt-1">Click an empty cell (•) to query Jev.</p>
                      </div>
                    ) : selectedResult ? (
                      <div className="space-y-4">
                        {/* Big Verdict Display */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-gray-50 dark:bg-black/40 rounded-xl border border-gray-200 dark:border-white/5">
                            <div className="text-[11px] text-gray-500">Jev Answer</div>
                            <div className="text-2xl font-bold font-mono text-pink-600 dark:text-pink-300 mt-0.5">
                              {selectedResult.choice}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-black/40 rounded-xl border border-gray-200 dark:border-white/5">
                            <div className="text-[11px] text-gray-500">Actual Solution</div>
                            <div className="text-2xl font-bold font-mono text-gray-800 dark:text-gray-200 mt-0.5">
                              {solution ? solution[selectedCell.row][selectedCell.col] : "-"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-2.5 bg-gray-50 dark:bg-black/30 rounded-xl border border-gray-200 dark:border-white/5">
                            <span className="text-[10px] text-gray-500 block">Confidence</span>
                            <span className="font-mono text-gray-900 dark:text-white font-semibold text-sm">
                              {(selectedResult.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="p-2.5 bg-gray-50 dark:bg-black/30 rounded-xl border border-gray-200 dark:border-white/5">
                            <span className="text-[10px] text-gray-500 block">Response Time</span>
                            <span className="font-mono text-gray-900 dark:text-white font-semibold text-sm">
                              {selectedResult.latencyMs} ms
                            </span>
                          </div>
                        </div>

                        {/* Probability Distribution */}
                        <div>
                          <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                            Probability Distribution (1-9)
                          </div>
                          <div className="space-y-1.5">
                            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => {
                              const prob = selectedResult.probabilities[digit] || 0;
                              const isTop = selectedResult.choice === digit;
                              const isActual =
                                solution && solution[selectedCell.row][selectedCell.col] === Number(digit);

                              return (
                                <div key={digit} className="flex items-center gap-2 text-xs">
                                  <span className={`w-3 font-mono ${isTop ? "text-pink-600 dark:text-pink-400 font-bold" : "text-gray-500"}`}>
                                    {digit}
                                  </span>
                                  <div className="flex-1 h-2.5 bg-gray-200 dark:bg-black/40 rounded-full overflow-hidden border border-gray-300 dark:border-white/5">
                                    <div
                                      className={`h-full transition-all duration-500 rounded-full ${
                                        isTop
                                          ? selectedResult.isCorrect
                                            ? "bg-emerald-500"
                                            : "bg-pink-500"
                                          : "bg-purple-400/40 dark:bg-purple-600/40"
                                      }`}
                                      style={{ width: `${Math.max(prob * 100, 2)}%` }}
                                    />
                                  </div>
                                  <span className="w-9 text-right font-mono text-gray-500 text-[10px]">
                                    {(prob * 100).toFixed(0)}%
                                  </span>
                                  {isActual && (
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                                      target
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500 text-sm">
                        <p>Click on this empty cell to query Jev.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500 text-sm">
                    <p>Select any empty cell on the board to inspect Jev&apos;s judgment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dedicated Jev Reasoning Trace (~32%) */}
        <div className="w-full lg:w-[360px] xl:w-[420px] shrink-0 sticky top-20">
          <TraceSidebar />
        </div>
      </div>

      {/* Abandon In-Progress Puzzle Confirmation Modal */}
      <AbandonConfirmModal
        isOpen={showAbandonModal}
        onConfirm={confirmAbandon}
        onCancel={cancelAbandon}
        gameType="sudoku"
      />
    </div>
  );
}
