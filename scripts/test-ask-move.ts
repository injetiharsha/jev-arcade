import { type Board, type Player, formatTicTacToeBoard } from "../lib/tictactoe";

interface TestCase {
  name: string;
  board: Board;
  player: Player;
  expectedOptimalMoves: number[];
}

const testCases: TestCase[] = [
  {
    name: "Scenario 1: Immediate Winning Move for X (Row 0)",
    // X X 2
    // O O 5
    // 6 7 8
    board: ["X", "X", null, "O", "O", null, null, null, null],
    player: "X",
    expectedOptimalMoves: [2],
  },
  {
    name: "Scenario 2: Immediate Block Move for X (O threatens Col 0)",
    // O 1 2
    // O X 5
    // 6 7 8
    board: ["O", null, null, "O", "X", null, null, null, null],
    player: "X",
    expectedOptimalMoves: [6],
  },
  {
    name: "Scenario 3: Immediate Winning Move for O (Diagonal 0-4-8)",
    // O X X
    // 3 O 5
    // 6 X 8
    board: ["O", "X", "X", null, "O", null, null, "X", null],
    player: "O",
    expectedOptimalMoves: [8],
  },
];

async function runApiTests() {
  console.log("================================================");
  console.log("  Testing POST /api/tictactoe/ask-move Endpoint ");
  console.log("================================================\n");

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`[Test #${i + 1}] ${tc.name}`);
    console.log(`Board State:\n${formatTicTacToeBoard(tc.board).split("\n").map(l => "  " + l).join("\n")}`);
    console.log(`Player: ${tc.player} | Expected Optimal Moves: [${tc.expectedOptimalMoves.join(", ")}]`);

    const startTime = performance.now();
    try {
      const res = await fetch("http://localhost:3000/api/tictactoe/ask-move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          board: tc.board,
          player: tc.player,
        }),
      });

      const elapsed = (performance.now() - startTime).toFixed(2);

      if (!res.ok) {
        const err = await res.text();
        console.error(`  FAIL: HTTP ${res.status}: ${err}\n`);
        continue;
      }

      const data = await res.json();
      console.log(`  Response (${elapsed} ms total, ${data.latencyMs} ms API):`);
      console.log(`    Jev Choice      : ${data.choice}`);
      console.log(`    Confidence      : ${(data.confidence * 100).toFixed(1)}%`);
      console.log(`    isOptimal / isCorrect: ${data.isCorrect}`);
      console.log(`    Optimal Moves   : [${data.optimalMoves.join(", ")}]`);
      console.log(`    Probabilities   :`, data.probabilities);

      const verificationPassed =
        typeof data.choice === "string" &&
        typeof data.confidence === "number" &&
        typeof data.latencyMs === "number" &&
        data.isCorrect === tc.expectedOptimalMoves.includes(Number(data.choice));

      console.log(`  Status: ${verificationPassed ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}\n`);
    } catch (e) {
      console.error("  Fetch error:", e);
    }
  }

  // Check database log
  const Database = (await import("better-sqlite3")).default;
  const db = new Database("data/jev-arcade.db");
  const recentLogs = db
    .prepare("SELECT id, game, choice, confidence, is_correct, latency_ms, created_at FROM jev_calls WHERE game = 'tictactoe' ORDER BY id DESC LIMIT 3")
    .all();

  console.log("Recent SQLite Logs for 'tictactoe':");
  console.log(recentLogs);
  console.log("\n================================================");
}

runApiTests();
