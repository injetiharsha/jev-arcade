import fs from "node:fs";
import path from "node:path";
import { generatePuzzle, countSolutions, isFullValidSudoku, type SudokuGrid } from "../lib/sudoku";

interface BankPuzzle {
  id: number;
  difficulty: "easy" | "medium" | "hard";
  givens: number;
  puzzle: SudokuGrid;
  solution: SudokuGrid;
}

function buildBank() {
  console.log("Generating verified Sudoku puzzle bank...");

  const counts = [
    { difficulty: "easy" as const, givens: 38, count: 7 },
    { difficulty: "medium" as const, givens: 32, count: 7 },
    { difficulty: "hard" as const, givens: 26, count: 7 },
  ];

  const bank: BankPuzzle[] = [];
  let idCounter = 1;

  for (const group of counts) {
    console.log(`Generating ${group.count} ${group.difficulty} puzzles (~${group.givens} givens)...`);
    for (let i = 0; i < group.count; i++) {
      let unique = false;
      let pObj: { puzzle: SudokuGrid; solution: SudokuGrid } | null = null;

      while (!unique) {
        pObj = generatePuzzle(group.givens);
        if (
          isFullValidSudoku(pObj.solution) &&
          countSolutions(pObj.puzzle, 2) === 1
        ) {
          unique = true;
        }
      }

      const actualGivens = pObj!.puzzle.flat().filter((c) => c !== 0).length;

      bank.push({
        id: idCounter++,
        difficulty: group.difficulty,
        givens: actualGivens,
        puzzle: pObj!.puzzle,
        solution: pObj!.solution,
      });
      console.log(`  ✓ Added Puzzle #${idCounter - 1} (${group.difficulty}, ${actualGivens} givens)`);
    }
  }

  const outDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "sudoku-puzzles.json");
  fs.writeFileSync(outPath, JSON.stringify(bank, null, 2), "utf8");
  console.log(`\nSuccessfully saved ${bank.length} verified puzzles to ${outPath}`);
}

buildBank();
