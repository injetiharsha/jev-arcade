import { NextRequest, NextResponse } from "next/server";
import { askJev } from "@/lib/jev";

/**
 * Formats the 9x9 grid with explicit row and column headers.
 */
export function formatSudokuGridState(puzzle: number[][]): string {
  const header = "Row/Col: 1 2 3 4 5 6 7 8 9";
  const rows = puzzle.map((row, r) => {
    const rowLabel = `Row ${r + 1}:  `;
    const cells = row.map((cell) => (cell === 0 ? "_" : String(cell))).join(" ");
    return `${rowLabel}${cells}`;
  });
  return [header, ...rows].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { puzzle, solution, row, col, mode, difficulty, stepIndex, sessionId, gameId } = body;

    // Payload validation
    if (
      !Array.isArray(puzzle) ||
      puzzle.length !== 9 ||
      puzzle.some((r) => !Array.isArray(r) || r.length !== 9) ||
      !Array.isArray(solution) ||
      solution.length !== 9 ||
      solution.some((r) => !Array.isArray(r) || r.length !== 9) ||
      typeof row !== "number" ||
      typeof col !== "number" ||
      row < 0 ||
      row > 8 ||
      col < 0 ||
      col > 8
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid payload. Required: puzzle (9x9 array), solution (9x9 array), row (0-8), col (0-8)",
        },
        { status: 400 }
      );
    }

    // Guard: Prevent asking for an already filled cell
    if (puzzle[row][col] !== 0) {
      return NextResponse.json(
        {
          error: `Cell at row ${row}, col ${col} is already filled with value ${puzzle[row][col]}.`,
        },
        { status: 400 }
      );
    }

    const state = formatSudokuGridState(puzzle);

    // Compute constraints for the target cell
    const row1 = row + 1;
    const col1 = col + 1;

    // Non-zero numbers in target row
    const rowNumbers = puzzle[row].filter((c: number) => c !== 0);

    // Non-zero numbers in target column
    const colNumbers: number[] = [];
    for (let r = 0; r < 9; r++) {
      if (puzzle[r][col] !== 0) colNumbers.push(puzzle[r][col]);
    }

    // Non-zero numbers in target 3x3 box
    const boxRowStart = Math.floor(row / 3) * 3;
    const boxColStart = Math.floor(col / 3) * 3;
    const boxNumbers: number[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const val = puzzle[boxRowStart + r][boxColStart + c];
        if (val !== 0) boxNumbers.push(val);
      }
    }

    const seen = new Set([...rowNumbers, ...colNumbers, ...boxNumbers]);
    const validCandidates = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !seen.has(n));

    const instructions = [
      "This is a standard 9x9 Sudoku puzzle. Each row, each column, and each 3x3 box must contain the digits 1-9 with no repeats.",
      `Given the puzzle grid above, what number belongs at Row ${row1}, Column ${col1}?`,
      `- Numbers already in Row ${row1}: [${rowNumbers.sort((a: number, b: number) => a - b).join(", ")}]`,
      `- Numbers already in Column ${col1}: [${colNumbers.sort((a: number, b: number) => a - b).join(", ")}]`,
      `- Numbers already in the 3x3 Box: [${boxNumbers.sort((a: number, b: number) => a - b).join(", ")}]`,
      `- Remaining valid candidate digits: [${validCandidates.join(", ")}]`,
      `The answer must not already appear elsewhere in Row ${row1}, Column ${col1}, or its 3x3 box. Which single digit (1-9) fills Row ${row1}, Column ${col1}?`,
    ].join("\n");

    console.log(`\n--- [ask-cell DEBUG] Step ${stepIndex ?? "manual"} | Target: Row ${row1}, Col ${col1} (0-indexed: r=${row}, c=${col}) ---`);
    console.log(`Grid State sent to Jev:\n${state}`);
    console.log(`Numbers already in Row ${row1}: [${rowNumbers.sort((a: number, b: number) => a - b).join(", ")}]`);
    console.log(`Numbers already in Col ${col1}: [${colNumbers.sort((a: number, b: number) => a - b).join(", ")}]`);
    console.log(`Numbers already in 3x3 Box: [${boxNumbers.sort((a: number, b: number) => a - b).join(", ")}]`);
    console.log(`Remaining valid candidate digits: [${validCandidates.join(", ")}]`);

    const criteria: Record<string, string | null> = {
      "1": null,
      "2": null,
      "3": null,
      "4": null,
      "5": null,
      "6": null,
      "7": null,
      "8": null,
      "9": null,
    };

    const expectedValueFromSolution = solution[row][col];

    const result = await askJev({
      sessionId,
      gameId,
      game: "sudoku",
      state,
      questionId: "cell_value",
      instructions,
      criteria,
      checkCorrect: (choice) => Number(choice) === expectedValueFromSolution,
      mode: mode === "autocomplete" ? "autocomplete" : "manual",
      difficulty: typeof difficulty === "string" ? difficulty : undefined,
      stepIndex: typeof stepIndex === "number" ? stepIndex : undefined,
    });

    return NextResponse.json({
      choice: result.choice,
      confidence: result.confidence,
      probabilities: result.probabilities,
      latencyMs: result.latencyMs,
      isCorrect: result.isCorrect,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = (error as any)?.statusCode === 403 ? 403 : 500;
    const code = (error as any)?.code || (status === 403 ? "FREE_LIMIT_REACHED" : "SERVER_ERROR");
    return NextResponse.json(
      {
        error: message,
        code,
      },
      { status }
    );
  }
}
