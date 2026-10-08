import puzzlesData from "../data/sudoku-puzzles.json";

function formatSudokuGridState(puzzle: number[][]): string {
  const header = "Row/Col: 1 2 3 4 5 6 7 8 9";
  const rows = puzzle.map((row, r) => {
    const rowLabel = `Row ${r + 1}:  `;
    const cells = row.map((cell) => (cell === 0 ? "_" : String(cell))).join(" ");
    return `${rowLabel}${cells}`;
  });
  return [header, ...rows].join("\n");
}

async function runAutocompleteDebugTest() {
  const puzzleItem = puzzlesData[0];
  const solution = puzzleItem.solution;
  const initialPuzzle = puzzleItem.puzzle;
  
  // Clone working grid
  const currentWorking = initialPuzzle.map((r: number[]) => [...r]);

  // Find first 6 empty cells
  const emptyCells: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (initialPuzzle[r][c] === 0 && emptyCells.length < 6) {
        emptyCells.push({ row: r, col: c });
      }
    }
  }

  console.log("================================================================================");
  console.log(" STARTING SHORT AUTOCOMPLETE DEBUG RUN (FIRST 6 CELLS)");
  console.log("================================================================================");

  for (let step = 0; step < emptyCells.length; step++) {
    const { row, col } = emptyCells[step];
    const row1 = row + 1;
    const col1 = col + 1;

    // 1. Compute hints on currentWorking immediately before fetch
    const rowNumbers = currentWorking[row].filter((c: number) => c !== 0);
    const colNumbers: number[] = [];
    for (let r = 0; r < 9; r++) {
      if (currentWorking[r][col] !== 0) colNumbers.push(currentWorking[r][col]);
    }
    const boxRowStart = Math.floor(row / 3) * 3;
    const boxColStart = Math.floor(col / 3) * 3;
    const boxNumbers: number[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const val = currentWorking[boxRowStart + r][boxColStart + c];
        if (val !== 0) boxNumbers.push(val);
      }
    }
    const seen = new Set([...rowNumbers, ...colNumbers, ...boxNumbers]);
    const validCandidates = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !seen.has(n));

    console.log(`\n================================================================================`);
    console.log(`[CLIENT DEBUG STEP ${step + 1}/6] Target: Row ${row1}, Col ${col1} (0-indexed: r=${row}, c=${col})`);
    console.log(`================================================================================`);
    console.log(`Numbers already in Row ${row1}: [${rowNumbers.sort((a: number, b: number) => a - b).join(", ")}]`);
    console.log(`Numbers already in Col ${col1}: [${colNumbers.sort((a: number, b: number) => a - b).join(", ")}]`);
    console.log(`Numbers already in 3x3 Box: [${boxNumbers.sort((a: number, b: number) => a - b).join(", ")}]`);
    console.log(`Remaining valid candidate digits: [${validCandidates.join(", ")}]`);
    console.log(`\nGrid State being sent in payload:\n${formatSudokuGridState(currentWorking)}\n`);

    const res = await fetch("http://localhost:3000/api/sudoku/ask-cell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        puzzle: currentWorking,
        solution,
        row,
        col,
        mode: "autocomplete",
        difficulty: "easy",
        stepIndex: step + 1,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`API error: ${JSON.stringify(err)}`);
    }

    const result = await res.json();
    const expectedValue = solution[row][col];
    console.log(`>>> Jev Answer Received: choice="${result.choice}", confidence=${(result.confidence * 100).toFixed(1)}%, isCorrect=${result.isCorrect} (Expected: ${expectedValue})`);

    // Accumulate Jev's answer into currentWorking
    const chosenDigit = Number(result.choice);
    currentWorking[row][col] = chosenDigit;
    console.log(`>>> Accumulated currentWorking[${row}][${col}] = ${chosenDigit} for subsequent steps.`);
  }

  console.log("\n================================================================================");
  console.log(" FINAL STATE OF FIRST 6 CELLS IN CURRENT WORKING GRID:");
  console.log("================================================================================");
  console.log(formatSudokuGridState(currentWorking));
}

runAutocompleteDebugTest().catch(console.error);
