import {
  type Board,
  type Player,
  computeMoveCriteria,
  formatTicTacToeBoard,
  minimaxAllBestMoves,
} from "../lib/tictactoe";

function runTacticalCriteriaTests() {
  console.log("=========================================");
  console.log("  Testing Tic-Tac-Toe Criteria Generator ");
  console.log("=========================================\n");

  // Scenario 1: Immediate Win vs Block
  // X X _
  // O _ O
  // _ _ _
  const board1: Board = ["X", "X", null, "O", null, "O", null, null, null];
  console.log("--- Scenario 1: Immediate Win vs Block vs Center ---");
  console.log(formatTicTacToeBoard(board1));
  const criteria1 = computeMoveCriteria(board1, "X");
  console.log("Computed Criteria for Player X:");
  console.log(JSON.stringify(criteria1, null, 2));

  const winMoveDesc = criteria1["2"];
  const blockMoveDesc = criteria1["4"];
  const centerMoveDesc = criteria1["4"]; // cell 4 is center and also blocks O
  const cornerMoveDesc = criteria1["6"];
  const edgeMoveDesc = criteria1["7"];

  const p1 = winMoveDesc === "Completes three in a row — WINNING MOVE";
  const p2 = blockMoveDesc === "Blocks opponent's winning line"; // Blocking takes precedence over just center
  const p4 = cornerMoveDesc === "Corner position";
  const p5 = edgeMoveDesc === "Edge position, no immediate tactical effect";

  console.log(`\nVerification:`);
  console.log(`  Cell 2 (Winning Move)  : "${winMoveDesc}" -> ${p1 ? "PASS" : "FAIL"}`);
  console.log(`  Cell 4 (Block Opponent): "${blockMoveDesc}" -> ${p2 ? "PASS" : "FAIL"}`);
  console.log(`  Cell 6 (Corner)        : "${cornerMoveDesc}" -> ${p4 ? "PASS" : "FAIL"}`);
  console.log(`  Cell 7 (Edge)          : "${edgeMoveDesc}" -> ${p5 ? "PASS" : "FAIL"}`);

  // Scenario 2: Center when not blocking
  const boardOpenCenter: Board = ["X", null, null, null, null, null, null, null, null];
  const criteriaOpen = computeMoveCriteria(boardOpenCenter, "O");
  const pCenter = criteriaOpen["4"] === "Center position";
  console.log(`  Cell 4 (Pure Center)   : "${criteriaOpen["4"]}" -> ${pCenter ? "PASS" : "FAIL"}`);

  // Scenario 3: Immediate Block for X at index 6
  const board2: Board = ["O", null, null, "O", "X", null, null, null, null];
  console.log("\n--- Scenario 3: Must Block Column 0 ---");
  console.log(formatTicTacToeBoard(board2));
  const criteria2 = computeMoveCriteria(board2, "X");
  console.log("Computed Criteria for Player X:");
  console.log(JSON.stringify(criteria2, null, 2));
  const p6 = criteria2["6"] === "Blocks opponent's winning line";
  console.log(`  Cell 6 (Must Block)    : "${criteria2["6"]}" -> ${p6 ? "PASS" : "FAIL"}`);

  const allPassed = p1 && p2 && pCenter && p4 && p5 && p6;
  console.log("\n-----------------------------------------");
  if (allPassed) {
    console.log("\x1b[32m✓ ALL TACTICAL CRITERIA UNIT TESTS PASSED!\x1b[0m");
  } else {
    console.log("\x1b[31m✗ SOME TESTS FAILED!\x1b[0m");
    process.exit(1);
  }
  console.log("-----------------------------------------\n");
}

runTacticalCriteriaTests();
