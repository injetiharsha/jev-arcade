import { NextRequest, NextResponse } from "next/server";
import { askJev } from "@/lib/jev";
import {
  type Board,
  type Player,
  getEmptyCells,
  checkWinner,
  minimaxAllBestMoves,
  formatTicTacToeBoard,
  computeMoveCriteria,
} from "@/lib/tictactoe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { board, player, sessionId, gameId } = body as {
      board: Board;
      player: Player;
      sessionId?: string;
      gameId?: string;
    };

    // Validation
    if (
      !Array.isArray(board) ||
      board.length !== 9 ||
      (player !== "X" && player !== "O")
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid payload. Required: board (array of length 9 containing null, 'X', or 'O'), player ('X' | 'O')",
        },
        { status: 400 }
      );
    }

    // Guard: Check if game is already terminal
    const currentWinner = checkWinner(board);
    if (currentWinner !== null) {
      return NextResponse.json(
        {
          error: `Game is already completed with result: "${currentWinner}". No further moves allowed.`,
        },
        { status: 400 }
      );
    }

    const emptyCells = getEmptyCells(board);
    if (emptyCells.length === 0) {
      return NextResponse.json(
        { error: "No empty cells remaining on the board (board is full)." },
        { status: 400 }
      );
    }

    // Deterministically compute tactical criteria descriptions for every open cell
    const criteria = computeMoveCriteria(board, player);

    if (Object.keys(criteria).length === 0) {
      return NextResponse.json(
        { error: "No valid move criteria could be computed for this board." },
        { status: 400 }
      );
    }

    const formattedBoard = formatTicTacToeBoard(board);
    const optimalMoves = minimaxAllBestMoves(board, player);

    const instructions = `You are playing tic-tac-toe as ${player}. Your goal is to win. Priority: (1) if any move wins immediately, take it. (2) if you don't win but the opponent could win next turn, block that. (3) otherwise prefer the center, then corners, then edges. Choose the best move from the options below, using the descriptions provided.`;

    const result = await askJev({
      sessionId,
      gameId,
      game: "tictactoe",
      state: formattedBoard,
      questionId: "move",
      instructions,
      criteria,
      checkCorrect: (choice) => optimalMoves.includes(Number(choice)),
    });

    return NextResponse.json({
      choice: result.choice,
      confidence: result.confidence,
      probabilities: result.probabilities,
      latencyMs: result.latencyMs,
      isCorrect: result.isCorrect,
      isOptimal: result.isCorrect,
      optimalMoves,
      criteriaSent: criteria,
      instructionsSent: instructions,
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
