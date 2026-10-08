import { NextRequest, NextResponse } from "next/server";
import { generatePuzzle } from "@/lib/sudoku";
import fs from "node:fs";
import path from "node:path";

interface BankPuzzle {
  id: number;
  difficulty: "easy" | "medium" | "hard";
  givens: number;
  puzzle: number[][];
  solution: number[][];
}

const BANK_PATH = path.join(process.cwd(), "data", "sudoku-puzzles.json");

// In-memory cache to prevent re-reading/re-parsing ~100KB JSON on every page load
let cachedBank: BankPuzzle[] | null = null;

function loadPuzzleBank(): BankPuzzle[] {
  if (cachedBank !== null) {
    return cachedBank;
  }
  if (fs.existsSync(BANK_PATH)) {
    try {
      const raw = fs.readFileSync(BANK_PATH, "utf8");
      cachedBank = JSON.parse(raw);
      return cachedBank || [];
    } catch (e) {
      console.error("[Puzzle Bank Error] Failed to read bank:", e);
    }
  }
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const difficultyParam = searchParams.get("difficulty") || "easy";

    const bank = loadPuzzleBank();

    if (difficultyParam === "random" || bank.length === 0) {
      // Dynamic live generation fallback
      const givensMap: Record<string, number> = {
        easy: 38,
        medium: 32,
        hard: 26,
        random: 32,
      };
      const givens = givensMap[difficultyParam] || 32;
      const { puzzle, solution } = generatePuzzle(givens);
      return NextResponse.json({
        id: "live-gen",
        difficulty: difficultyParam,
        source: "live_generator",
        puzzle,
        solution,
      });
    }

    // Filter bank by difficulty if requested
    const filtered =
      difficultyParam === "all"
        ? bank
        : bank.filter((p) => p.difficulty === difficultyParam);

    const candidates = filtered.length > 0 ? filtered : bank;
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    return NextResponse.json({
      id: selected.id,
      difficulty: selected.difficulty,
      source: "verified_bank",
      puzzle: selected.puzzle,
      solution: selected.solution,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate puzzle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
