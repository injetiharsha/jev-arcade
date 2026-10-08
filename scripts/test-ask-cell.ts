import { generatePuzzle } from "../lib/sudoku";

async function main() {
  console.log("Generating a Sudoku puzzle...");
  const { puzzle, solution } = generatePuzzle(36);

  // Find an empty cell
  let targetRow = -1;
  let targetCol = -1;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle[r][c] === 0) {
        targetRow = r;
        targetCol = c;
        break;
      }
    }
    if (targetRow !== -1) break;
  }

  const expectedValue = solution[targetRow][targetCol];

  console.log(`Target Cell: row=${targetRow}, col=${targetCol} (Expected Solution: ${expectedValue})`);
  console.log("Current Grid:");
  console.log(
    puzzle
      .map((row) => row.map((c) => (c === 0 ? "_" : String(c))).join(" "))
      .join("\n")
  );

  const payload = {
    puzzle,
    solution,
    row: targetRow,
    col: targetCol,
  };

  console.log("\nCalling POST http://localhost:3000/api/sudoku/ask-cell...");
  const startTime = performance.now();

  try {
    const response = await fetch("http://localhost:3000/api/sudoku/ask-cell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const elapsed = (performance.now() - startTime).toFixed(2);

    if (!response.ok) {
      const err = await response.text();
      console.error(`HTTP error ${response.status}:`, err);
      process.exit(1);
    }

    const data = await response.json();
    console.log(`\nResponse received in ${elapsed} ms:`);
    console.log(JSON.stringify(data, null, 2));

    console.log("\n--- Verification ---");
    console.log(`Predicted Choice : ${data.choice}`);
    console.log(`Expected Value   : ${expectedValue}`);
    console.log(`Confidence       : ${data.confidence}`);
    console.log(`isCorrect (flag) : ${data.isCorrect}`);
    console.log(`Latency Reported : ${data.latencyMs} ms`);

    if (data.isCorrect === (Number(data.choice) === expectedValue)) {
      console.log("\x1b[32m✓ Correctness calculation verified successfully!\x1b[0m");
    } else {
      console.error("\x1b[31m✗ Correctness flag does not match expected result.\x1b[0m");
      process.exit(1);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
    process.exit(1);
  }
}

main();
