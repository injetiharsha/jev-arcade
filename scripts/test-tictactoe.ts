import {
  type Board,
  type Player,
  checkWinner,
  checkWinnerWithLine,
  getEmptyCells,
  minimaxBestMove,
  minimaxAllBestMoves,
  formatTicTacToeBoard,
} from "../lib/tictactoe";

function simulateMinimaxSelfPlay(): { winner: "X" | "O" | "draw"; moves: number[] } {
  const board: Board = Array(9).fill(null);
  let currentPlayer: Player = "X";
  const moveHistory: number[] = [];

  while (checkWinner(board) === null) {
    const bestMove = minimaxBestMove(board, currentPlayer);
    board[bestMove] = currentPlayer;
    moveHistory.push(bestMove);
    currentPlayer = currentPlayer === "X" ? "O" : "X";
  }

  const result = checkWinner(board);
  return {
    winner: result as "X" | "O" | "draw",
    moves: moveHistory,
  };
}

function runTests() {
  console.log("=========================================");
  console.log("  Running Deterministic Tic-Tac-Toe Tests ");
  console.log("=========================================\n");

  let allPassed = true;

  // Test 1: Minimax vs Minimax self-play
  console.log("[Test 1] Minimax vs Minimax Self-Play from empty board...");
  const selfPlay = simulateMinimaxSelfPlay();
  const selfPlayPassed = selfPlay.winner === "draw";

  if (!selfPlayPassed) allPassed = false;
  console.log(
    `  Result: ${selfPlay.winner} (Moves: ${selfPlay.moves.join(" -> ")}) | ` +
      `Check: ${selfPlayPassed ? "\x1b[32mPASS (Guaranteed Draw)\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}\n`
  );

  // Test 2: Hand-constructed test cases
  console.log("[Test 2] Hand-Constructed Tactical Scenarios...");

  interface TestCase {
    name: string;
    board: Board;
    player: Player;
    expectedMoves: number[]; // exact optimal move(s)
  }

  const testCases: TestCase[] = [
    {
      name: "Immediate Winning Move for X (Row 0)",
      // X X _
      // O O _
      // _ _ _
      board: ["X", "X", null, "O", "O", null, null, null, null],
      player: "X",
      expectedMoves: [2],
    },
    {
      name: "Immediate Block Move for X (O threatens Win on Col 0)",
      // O _ _
      // O X _
      // _ _ _
      board: ["O", null, null, "O", "X", null, null, null, null],
      player: "X",
      expectedMoves: [6],
    },
    {
      name: "Immediate Winning Move for O (Diagonal 0-4-8)",
      // O X X
      // _ O _
      // _ X _
      board: ["O", "X", "X", null, "O", null, null, "X", null],
      player: "O",
      expectedMoves: [8],
    },
    {
      name: "Center Defense: X takes corner (0), O MUST take center (4)",
      // X _ _
      // _ _ _
      // _ _ _
      board: ["X", null, null, null, null, null, null, null, null],
      player: "O",
      expectedMoves: [4],
    },
    {
      name: "Blocking Opponent Fork: X has opposite corners (0, 8), O in center (4) -> O must play side",
      // X _ _
      // _ O _
      // _ _ X
      board: ["X", null, null, null, "O", null, null, null, "X"],
      player: "O",
      expectedMoves: [1, 3, 5, 7], // Sides avoid falling into corner traps
    },
    {
      name: "Double Win Fork Execution for X",
      // X _ _
      // _ O _
      // _ _ X
      // With empty corners, playing corner 2 or 6 sets up 2 winning threats
      board: ["X", "O", null, null, "O", null, "X", null, null],
      player: "X",
      expectedMoves: [3], // Block O's win on center column
    },
  ];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const bestMove = minimaxBestMove([...tc.board], tc.player);
    const allOptimalMoves = minimaxAllBestMoves([...tc.board], tc.player);

    const matchesExpected =
      tc.expectedMoves.includes(bestMove) &&
      allOptimalMoves.length === tc.expectedMoves.length &&
      allOptimalMoves.every((m) => tc.expectedMoves.includes(m));

    if (!matchesExpected) {
      allPassed = false;
    }

    console.log(`  Scenario #${i + 1}: ${tc.name}`);
    console.log(`    Board:\n${formatTicTacToeBoard(tc.board).split("\n").map(l => "      " + l).join("\n")}`);
    console.log(`    Player: ${tc.player}`);
    console.log(`    Expected Optimal Move(s) : [${tc.expectedMoves.join(", ")}]`);
    console.log(`    Actual Optimal Move(s)   : [${allOptimalMoves.join(", ")}] (Picked: ${bestMove})`);
    console.log(`    Status                   : ${matchesExpected ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}\n`);
  }

  // Test 3: Explicit Win Detection Tests for all 8 lines including Anti-Diagonal
  console.log("[Test 3] Explicit Win Line Detection & Anti-Diagonal Guard...");
  
  // Anti-diagonal win test: top-right (2), center (4), bottom-left (6)
  const antiDiagBoard: Board = [
    "O", "X", "X",
    "O", "X", null,
    "X", null, "O",
  ];
  const antiDiagRes = checkWinnerWithLine(antiDiagBoard);
  const antiDiagPassed =
    antiDiagRes.winner === "X" &&
    antiDiagRes.winningLine !== null &&
    antiDiagRes.winningLine[0] === 2 &&
    antiDiagRes.winningLine[1] === 4 &&
    antiDiagRes.winningLine[2] === 6;

  console.log(`  Anti-Diagonal Test (indices [2, 4, 6]):`);
  console.log(`    Winner: ${antiDiagRes.winner} | Winning Line: [${antiDiagRes.winningLine?.join(", ")}]`);
  console.log(`    Status: ${antiDiagPassed ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}\n`);

  if (!antiDiagPassed) allPassed = false;

  console.log("-----------------------------------------");
  if (allPassed) {
    console.log("\x1b[32m✓ ALL TIC-TAC-TOE ENGINE & WIN LINE TESTS PASSED!\x1b[0m");
    console.log("-----------------------------------------\n");
  } else {
    console.log("\x1b[31m✗ SOME TESTS FAILED!\x1b[0m");
    console.log("-----------------------------------------\n");
    process.exit(1);
  }
}

runTests();
