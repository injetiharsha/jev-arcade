export type SudokuGrid = number[][];

/**
 * Creates a deep copy of a 9x9 Sudoku grid.
 */
export function cloneGrid(grid: SudokuGrid): SudokuGrid {
  return grid.map((row) => [...row]);
}

/**
 * Validates whether placing `value` at `(row, col)` violates any standard Sudoku rule
 * (row, column, or 3x3 subgrid).
 */
export function isValidPlacement(
  grid: SudokuGrid,
  row: number,
  col: number,
  value: number
): boolean {
  if (value < 1 || value > 9) return false;

  // Check row and column
  for (let i = 0; i < 9; i++) {
    if (i !== col && grid[row][i] === value) return false;
    if (i !== row && grid[i][col] === value) return false;
  }

  // Check 3x3 subgrid box
  const boxRowStart = Math.floor(row / 3) * 3;
  const boxColStart = Math.floor(col / 3) * 3;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const currRow = boxRowStart + r;
      const currCol = boxColStart + c;
      if ((currRow !== row || currCol !== col) && grid[currRow][currCol] === value) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Checks if a partial 9x9 grid has any rule violations (duplicates among non-zero cells).
 */
export function isPartiallyValidSudoku(grid: SudokuGrid): boolean {
  if (!Array.isArray(grid) || grid.length !== 9 || grid.some((r) => !Array.isArray(r) || r.length !== 9)) {
    return false;
  }

  // Check rows and columns for duplicates among non-zero numbers
  for (let i = 0; i < 9; i++) {
    const rowSeen = new Set<number>();
    const colSeen = new Set<number>();

    for (let j = 0; j < 9; j++) {
      const rowVal = grid[i][j];
      const colVal = grid[j][i];

      if (rowVal !== 0) {
        if (rowVal < 1 || rowVal > 9 || rowSeen.has(rowVal)) return false;
        rowSeen.add(rowVal);
      }

      if (colVal !== 0) {
        if (colVal < 1 || colVal > 9 || colSeen.has(colVal)) return false;
        colSeen.add(colVal);
      }
    }
  }

  // Check all 3x3 boxes
  for (let boxRow = 0; boxRow < 9; boxRow += 3) {
    for (let boxCol = 0; boxCol < 9; boxCol += 3) {
      const boxSeen = new Set<number>();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const val = grid[boxRow + r][boxCol + c];
          if (val !== 0) {
            if (val < 1 || val > 9 || boxSeen.has(val)) return false;
            boxSeen.add(val);
          }
        }
      }
    }
  }

  return true;
}

/**
 * Checks if a complete 9x9 grid is a valid, solved Sudoku board.
 */
export function isFullValidSudoku(grid: SudokuGrid): boolean {
  if (!Array.isArray(grid) || grid.length !== 9 || grid.some((r) => !Array.isArray(r) || r.length !== 9)) {
    return false;
  }

  // Check all rows and columns
  for (let i = 0; i < 9; i++) {
    const rowSeen = new Set<number>();
    const colSeen = new Set<number>();

    for (let j = 0; j < 9; j++) {
      const rowVal = grid[i][j];
      const colVal = grid[j][i];

      if (rowVal < 1 || rowVal > 9 || rowSeen.has(rowVal)) return false;
      if (colVal < 1 || colVal > 9 || colSeen.has(colVal)) return false;

      rowSeen.add(rowVal);
      colSeen.add(colVal);
    }
  }

  // Check all 3x3 boxes
  for (let boxRow = 0; boxRow < 9; boxRow += 3) {
    for (let boxCol = 0; boxCol < 9; boxCol += 3) {
      const boxSeen = new Set<number>();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const val = grid[boxRow + r][boxCol + c];
          if (val < 1 || val > 9 || boxSeen.has(val)) return false;
          boxSeen.add(val);
        }
      }
    }
  }

  return true;
}

export interface SudokuViolations {
  hasViolations: boolean;
  rowDuplicates: Array<{ row: number; duplicateValues: number[] }>;
  colDuplicates: Array<{ col: number; duplicateValues: number[] }>;
  boxDuplicates: Array<{ boxRow: number; boxCol: number; duplicateValues: number[] }>;
  totalDuplicatesCount: number;
}

/**
 * Returns detailed duplicate violations across all rows, columns, and 3x3 boxes.
 */
export function getSudokuViolations(grid: SudokuGrid): SudokuViolations {
  const rowDuplicates: Array<{ row: number; duplicateValues: number[] }> = [];
  const colDuplicates: Array<{ col: number; duplicateValues: number[] }> = [];
  const boxDuplicates: Array<{ boxRow: number; boxCol: number; duplicateValues: number[] }> = [];

  for (let i = 0; i < 9; i++) {
    // Check row i
    const rowCounts: Record<number, number> = {};
    for (let j = 0; j < 9; j++) {
      const val = grid[i][j];
      if (val >= 1 && val <= 9) {
        rowCounts[val] = (rowCounts[val] || 0) + 1;
      }
    }
    const rowDups = Object.entries(rowCounts)
      .filter(([, count]) => count > 1)
      .map(([val]) => Number(val));
    if (rowDups.length > 0) {
      rowDuplicates.push({ row: i, duplicateValues: rowDups });
    }

    // Check col i
    const colCounts: Record<number, number> = {};
    for (let j = 0; j < 9; j++) {
      const val = grid[j][i];
      if (val >= 1 && val <= 9) {
        colCounts[val] = (colCounts[val] || 0) + 1;
      }
    }
    const colDups = Object.entries(colCounts)
      .filter(([, count]) => count > 1)
      .map(([val]) => Number(val));
    if (colDups.length > 0) {
      colDuplicates.push({ col: i, duplicateValues: colDups });
    }
  }

  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 9; boxRow += 3) {
    for (let boxCol = 0; boxCol < 9; boxCol += 3) {
      const boxCounts: Record<number, number> = {};
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const val = grid[boxRow + r][boxCol + c];
          if (val >= 1 && val <= 9) {
            boxCounts[val] = (boxCounts[val] || 0) + 1;
          }
        }
      }
      const boxDups = Object.entries(boxCounts)
        .filter(([, count]) => count > 1)
        .map(([val]) => Number(val));
      if (boxDups.length > 0) {
        boxDuplicates.push({ boxRow: boxRow / 3, boxCol: boxCol / 3, duplicateValues: boxDups });
      }
    }
  }

  const totalDuplicatesCount =
    rowDuplicates.length + colDuplicates.length + boxDuplicates.length;

  return {
    hasViolations: totalDuplicatesCount > 0,
    rowDuplicates,
    colDuplicates,
    boxDuplicates,
    totalDuplicatesCount,
  };
}

/**
 * Finds the first empty cell (0) in the grid using Minimum Remaining Values (MRV) heuristic.
 */
function findBestEmptyCell(
  grid: SudokuGrid
): { row: number; col: number; candidates: number[] } | null {
  let bestCell: { row: number; col: number; candidates: number[] } | null = null;
  let minCandidates = 10;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const candidates: number[] = [];
        for (let val = 1; val <= 9; val++) {
          if (isValidPlacement(grid, r, c, val)) {
            candidates.push(val);
          }
        }

        // If a cell has 0 candidates, it's a dead end immediately
        if (candidates.length === 0) {
          return { row: r, col: c, candidates: [] };
        }

        if (candidates.length < minCandidates) {
          minCandidates = candidates.length;
          bestCell = { row: r, col: c, candidates };
          if (minCandidates === 1) return bestCell;
        }
      }
    }
  }

  return bestCell;
}

/**
 * Solves a 9x9 Sudoku puzzle using backtracking with MRV heuristic.
 * Returns a new solved 9x9 grid or null if unsolvable.
 */
export function solve(grid: SudokuGrid): SudokuGrid | null {
  const workingGrid = cloneGrid(grid);

  function backtrack(): boolean {
    const cell = findBestEmptyCell(workingGrid);
    if (!cell) {
      return true;
    }

    const { row, col, candidates } = cell;
    if (candidates.length === 0) {
      return false;
    }

    for (const val of candidates) {
      workingGrid[row][col] = val;
      if (backtrack()) {
        return true;
      }
      workingGrid[row][col] = 0;
    }

    return false;
  }

  if (backtrack()) {
    return workingGrid;
  }

  return null;
}

/**
 * Counts the number of solutions for a given grid up to a specified limit.
 */
export function countSolutions(grid: SudokuGrid, limit = 2): number {
  const workingGrid = cloneGrid(grid);
  let solutions = 0;

  function backtrack(): boolean {
    const cell = findBestEmptyCell(workingGrid);
    if (!cell) {
      solutions++;
      return solutions >= limit;
    }

    const { row, col, candidates } = cell;
    if (candidates.length === 0) return false;

    for (const val of candidates) {
      workingGrid[row][col] = val;
      if (backtrack()) return true;
      workingGrid[row][col] = 0;
    }

    return false;
  }

  backtrack();
  return solutions;
}

/**
 * Generates a full, randomized valid solved Sudoku grid.
 */
function generateFullSolvedGrid(): SudokuGrid {
  const grid: SudokuGrid = Array.from({ length: 9 }, () => Array(9).fill(0));

  function shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function fill(): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (const num of numbers) {
            if (isValidPlacement(grid, r, c, num)) {
              grid[r][c] = num;
              if (fill()) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  fill();
  return grid;
}

/**
 * Generates a valid, solvable 9x9 Sudoku puzzle with roughly `givenCells` filled cells.
 * Guaranteed to have exactly ONE unique solution, a fully valid solution grid,
 * and a partially valid puzzle grid with no duplicate givens.
 */
export function generatePuzzle(givenCells: number): {
  puzzle: SudokuGrid;
  solution: SudokuGrid;
} {
  const targetGivens = Math.max(17, Math.min(80, givenCells));

  // Outer loop to guarantee uniqueness and validity checks
  while (true) {
    const solution = generateFullSolvedGrid();

    // 1. Verify the FULL solution grid is valid
    if (!isFullValidSudoku(solution)) {
      console.error("[generatePuzzle Error] Solution grid failed isFullValidSudoku validation. Regenerating...");
      continue;
    }

    const puzzle = cloneGrid(solution);

    // Collect all 81 cell coordinates and shuffle them
    const positions: Array<[number, number]> = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    let filledCount = 81;

    for (const [r, c] of positions) {
      if (filledCount <= targetGivens) break;

      const backup = puzzle[r][c];
      puzzle[r][c] = 0;

      // Verify the puzzle remains uniquely solvable
      if (countSolutions(puzzle, 2) === 1) {
        filledCount--;
      } else {
        // Revert if removal creates multiple solutions
        puzzle[r][c] = backup;
      }
    }

    // 2. Verify the PUZZLE grid contains no duplicate values among givens
    if (!isPartiallyValidSudoku(puzzle)) {
      console.error("[generatePuzzle Error] Puzzle grid has duplicate givens in row/col/box. Regenerating...");
      continue;
    }

    // 3. Verify exactly 1 unique solution
    if (countSolutions(puzzle, 2) === 1) {
      return { puzzle, solution };
    }
  }
}
