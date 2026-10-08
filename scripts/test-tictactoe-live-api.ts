import {
  type Board,
  type Player,
  computeMoveCriteria,
  formatTicTacToeBoard,
  minimaxAllBestMoves,
} from "../lib/tictactoe";
import { askJev } from "../lib/jev";

async function testLiveTacticalMoves() {
  console.log("=========================================");
  console.log("  Live API Test: Tactical Tic-Tac-Toe    ");
  console.log("=========================================\n");

  const scenarios: Array<{
    name: string;
    board: Board;
    player: Player;
    expectedChoices: string[];
  }> = [
    {
      name: "Immediate Winning Move for X (Row 0: Cell 2)",
      board: ["X", "X", null, "O", "O", null, null, null, null],
      player: "X",
      expectedChoices: ["2"],
    },
    {
      name: "Immediate Block Move for X (O on Col 0: Cell 6)",
      board: ["O", null, null, "O", "X", null, null, null, null],
      player: "X",
      expectedChoices: ["6"],
    },
    {
      name: "Immediate Winning Move for O (Diagonal: Cell 8)",
      board: ["O", "X", "X", null, "O", null, null, "X", null],
      player: "O",
      expectedChoices: ["8"],
    },
  ];

  for (const s of scenarios) {
    const criteria = computeMoveCriteria(s.board, s.player);
    const state = formatTicTacToeBoard(s.board);

    console.log(`Scenario: ${s.name}`);
    console.log(`Board:\n${state}`);
    console.log(`Criteria Sent:\n${JSON.stringify(criteria, null, 2)}`);

    try {
      const res = await fetch("http://localhost:3000/api/tictactoe/ask-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board: s.board,
          player: s.player,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const result = await res.json();
      console.log(`Jev Choice: "${result.choice}" (Confidence: ${(result.confidence * 100).toFixed(1)}%, Latency: ${result.latencyMs}ms)`);
      console.log(`Expected  : [${s.expectedChoices.join(", ")}]`);
      const matched = s.expectedChoices.includes(String(result.choice));
      console.log(`Verdict   : ${matched ? "\x1b[32mPASS (Optimal Tactical Choice)\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}\n`);
    } catch (err: unknown) {
      console.error(`API Call failed:`, err);
    }
  }
}

testLiveTacticalMoves();
