import {
  generatePuzzle,
  solve,
  isValidPlacement,
  isFullValidSudoku,
  type SudokuGrid,
} from "../lib/sudoku";

function printBoard(grid: SudokuGrid) {
  return grid
    .map((row, r) => {
      const line = row
        .map((cell, c) => (cell === 0 ? "." : cell.toString()) + (c % 3 === 2 && c !== 8 ? " | " : " "))
        .join("");
      return (r % 3 === 0 && r !== 0 ? "------+-------+------\n" : "") + line;
    })
    .join("\n");
}

function countFilledCells(grid: SudokuGrid): number {
  return grid.reduce((acc, row) => acc + row.filter((c) => c !== 0).length, 0);
}

function runTests() {
  console.log("=========================================");
  console.log("  Running Deterministic Sudoku Test Suite ");
  console.log("=========================================\n");

  // Test 1: Validate isValidPlacement logic
  console.log("[Test Suite 1] Unit test isValidPlacement...");
  const sampleGrid: SudokuGrid = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];

  // 5 is in row 0 -> placing 5 at (0, 2) should fail
  const testPlacementInvalidRow = !isValidPlacement(sampleGrid, 0, 2, 5);
  // 9 is in col 4 -> placing 9 at (6, 4) should fail
  const testPlacementInvalidCol = !isValidPlacement(sampleGrid, 6, 4, 9);
  // 6 is in top-left 3x3 box -> placing 6 at (0, 2) should fail
  const testPlacementInvalidBox = !isValidPlacement(sampleGrid, 0, 2, 6);
  // 1 is not in row 0, col 2, or top-left box -> placing 1 at (0, 2) should pass
  const testPlacementValid = isValidPlacement(sampleGrid, 0, 2, 1);

  if (
    testPlacementInvalidRow &&
    testPlacementInvalidCol &&
    testPlacementInvalidBox &&
    testPlacementValid
  ) {
    console.log("  PASS: isValidPlacement checks passed successfully.\n");
  } else {
    console.error("  FAIL: isValidPlacement failed validation checks.");
    process.exit(1);
  }

  // Test 2: Generate 10 puzzles, solve, and verify
  console.log("[Test Suite 2] Generating & Solving 10 Puzzles...");
  const givenTargetCounts = [30, 32, 34, 36, 38, 40, 42, 45, 48, 50];
  let allPassed = true;

  for (let i = 0; i < 10; i++) {
    const targetGivens = givenTargetCounts[i];
    const startTime = performance.now();

    const { puzzle, solution } = generatePuzzle(targetGivens);
    const genTimeMs = (performance.now() - startTime).toFixed(1);

    const actualGivens = countFilledCells(puzzle);
    const isSolutionValid = isFullValidSudoku(solution);

    const solveStartTime = performance.now();
    const solvedPuzzle = solve(puzzle);
    const solveTimeMs = (performance.now() - solveStartTime).toFixed(2);

    const isSolvedCorrect =
      solvedPuzzle !== null && isFullValidSudoku(solvedPuzzle);

    // Verify solved matches generated solution or another valid solution
    const matchesSolution =
      solvedPuzzle !== null &&
      JSON.stringify(solvedPuzzle) === JSON.stringify(solution);

    const testPassed = isSolutionValid && isSolvedCorrect && matchesSolution;

    if (!testPassed) {
      allPassed = false;
    }

    const puzzleNumStr = String(i + 1).padStart(2, " ");
    const givensStr = String(actualGivens).padStart(2, " ");

    console.log(
      `  Puzzle #${puzzleNumStr}: Target=${targetGivens}, Actual Givens=${givensStr} | ` +
        `Gen: ${genTimeMs.padStart(5, " ")}ms | Solve: ${solveTimeMs.padStart(5, " ")}ms | ` +
        `Valid Solution: ${isSolutionValid ? "YES" : "NO"} | Solvable: ${isSolvedCorrect ? "YES" : "NO"} | ` +
        `Result: ${testPassed ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}`
    );
  }

  console.log("\n-----------------------------------------");
  if (allPassed) {
    console.log("\x1b[32m✓ ALL 10 PUZZLE TESTS PASSED SUCCESSFULLY!\x1b[0m");
    console.log("-----------------------------------------\n");
  } else {
    console.log("\x1b[31m✗ SOME TESTS FAILED!\x1b[0m");
    console.log("-----------------------------------------\n");
    process.exit(1);
  }
}

runTests();
