export type Player = "X" | "O";
export type Cell = null | Player;
export type Board = Cell[]; // length 9, index 0-8, row-major

const WINNING_COMBINATIONS = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * Returns all empty cell indices (0 to 8) for the board.
 */
export function getEmptyCells(board: Board): number[] {
  const empty: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      empty.push(i);
    }
  }
  return empty;
}

/**
 * Evaluates the board status and returns the winning line coordinates if any.
 */
export function checkWinnerWithLine(board: Board): {
  winner: "X" | "O" | "draw" | null;
  winningLine: number[] | null;
} {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningLine: combo };
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { winner: "draw", winningLine: null };
  }

  return { winner: null, winningLine: null };
}

/**
 * Evaluates the board status.
 * Returns: "X" | "O" (winner), "draw" (game over, no winner), or null (in progress).
 */
export function checkWinner(board: Board): "X" | "O" | "draw" | null {
  return checkWinnerWithLine(board).winner;
}

/**
 * Helper to get opponent of the current player.
 */
export function getOpponent(player: Player): Player {
  return player === "X" ? "O" : "X";
}

const CORNER_CELLS = new Set([0, 2, 6, 8]);
const CENTER_CELL = 4;

/**
 * Computes tactical criteria descriptions for all empty cells on the board.
 */
export function computeMoveCriteria(
  board: Board,
  player: Player
): Record<string, string> {
  const emptyCells = getEmptyCells(board);
  const opponent = getOpponent(player);
  const criteria: Record<string, string> = {};

  for (const cell of emptyCells) {
    // 1. Check for immediate winning move for player
    const playerWinBoard = [...board];
    playerWinBoard[cell] = player;
    if (checkWinner(playerWinBoard) === player) {
      criteria[String(cell)] = "Completes three in a row — WINNING MOVE";
      continue;
    }

    // 2. Check if this cell blocks an immediate winning line of opponent
    const opponentWinBoard = [...board];
    opponentWinBoard[cell] = opponent;
    if (checkWinner(opponentWinBoard) === opponent) {
      criteria[String(cell)] = "Blocks opponent's winning line";
      continue;
    }

    // 3. Center position
    if (cell === CENTER_CELL) {
      criteria[String(cell)] = "Center position";
      continue;
    }

    // 4. Corner position
    if (CORNER_CELLS.has(cell)) {
      criteria[String(cell)] = "Corner position";
      continue;
    }

    // 5. Edge position
    criteria[String(cell)] = "Edge position, no immediate tactical effect";
  }

  return criteria;
}

/**
 * Evaluates the score of a terminal state from the perspective of `maximizingPlayer`.
 * Win for maximizingPlayer = +10 - depth
 * Loss for maximizingPlayer = -10 + depth
 * Draw = 0
 */
function minimaxScore(
  board: Board,
  currentPlayer: Player,
  maximizingPlayer: Player,
  depth: number
): number {
  const winner = checkWinner(board);
  if (winner === maximizingPlayer) return 10 - depth;
  if (winner === getOpponent(maximizingPlayer)) return depth - 10;
  if (winner === "draw") return 0;

  const emptyCells = getEmptyCells(board);

  if (currentPlayer === maximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of emptyCells) {
      board[move] = currentPlayer;
      const evaluation = minimaxScore(
        board,
        getOpponent(currentPlayer),
        maximizingPlayer,
        depth + 1
      );
      board[move] = null;
      maxEval = Math.max(maxEval, evaluation);
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of emptyCells) {
      board[move] = currentPlayer;
      const evaluation = minimaxScore(
        board,
        getOpponent(currentPlayer),
        maximizingPlayer,
        depth + 1
      );
      board[move] = null;
      minEval = Math.min(minEval, evaluation);
    }
    return minEval;
  }
}

/**
 * Returns all optimal move indices for `player` on the given board.
 */
export function minimaxAllBestMoves(board: Board, player: Player): number[] {
  const emptyCells = getEmptyCells(board);
  if (emptyCells.length === 0 || checkWinner(board) !== null) {
    return [];
  }

  const scores: { move: number; score: number }[] = [];
  let bestScore = -Infinity;

  for (const move of emptyCells) {
    board[move] = player;
    const score = minimaxScore(board, getOpponent(player), player, 0);
    board[move] = null;

    scores.push({ move, score });
    if (score > bestScore) {
      bestScore = score;
    }
  }

  return scores.filter((s) => s.score === bestScore).map((s) => s.move);
}

/**
 * Returns a single optimal move index for `player` on the given board.
 */
export function minimaxBestMove(board: Board, player: Player): number {
  const bestMoves = minimaxAllBestMoves(board, player);
  if (bestMoves.length === 0) {
    throw new Error("No valid moves available on the board.");
  }
  return bestMoves[0];
}

/**
 * Formats the board into a clear text grid showing cell contents or empty index numbers.
 * Example:
 *  0 | X | 2
 * ---+---+---
 *  O | 4 | X
 * ---+---+---
 *  6 | 7 | O
 */
export function formatTicTacToeBoard(board: Board): string {
  const cells = board.map((c, i) => (c === null ? String(i) : c));
  const row0 = ` ${cells[0]} | ${cells[1]} | ${cells[2]} `;
  const row1 = ` ${cells[3]} | ${cells[4]} | ${cells[5]} `;
  const row2 = ` ${cells[6]} | ${cells[7]} | ${cells[8]} `;
  const divider = "---+---+---";
  return [row0, divider, row1, divider, row2].join("\n");
}
