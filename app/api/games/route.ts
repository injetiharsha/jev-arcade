import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";

// POST /api/games - Start a new game
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, sessionId, gameType } = body as {
      id: string;
      sessionId: string;
      gameType: string;
    };

    // Check if session exists and is active
    const existingSession = await db.queryOne<{ id: string; ended_at: string | null }>(
      "SELECT id, ended_at FROM sessions WHERE id = ?",
      [sessionId]
    );

    if (existingSession?.ended_at) {
      return NextResponse.json(
        { error: "Session has ended. Please start a new session.", sessionEnded: true },
        { status: 403 }
      );
    }

    // Ensure session exists
    await db.execute(
      `INSERT INTO sessions (id, created_at, total_games)
       VALUES (?, NOW(), 1)
       ON CONFLICT(id) DO UPDATE SET total_games = sessions.total_games + 1`,
      [sessionId]
    );

    // Insert game
    await db.execute(
      `INSERT INTO games (id, session_id, game_type, started_at, result)
       VALUES (?, ?, ?, NOW(), 'in_progress')
       ON CONFLICT(id) DO NOTHING`,
      [id, sessionId, gameType]
    );

    return NextResponse.json({ success: true, gameId: id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/games - Update game end result
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, result } = body as {
      id: string;
      result: "win" | "loss" | "draw" | "completed" | "abandoned";
    };

    if (!id || !result) {
      return NextResponse.json(
        { error: "Missing required fields: id, result" },
        { status: 400 }
      );
    }

    await db.execute(
      `UPDATE games
       SET result = ?, completed_at = NOW()
       WHERE id = ?`,
      [result, id]
    );

    return NextResponse.json({ success: true, gameId: id, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/games - Discard empty game with 0 calls
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing game id" }, { status: 400 });
    }

    // Check if game has any associated calls in jev_calls
    const callCountResult = await db.queryOne<{ count: number | string }>(
      "SELECT COUNT(*) as count FROM jev_calls WHERE game_id = ?",
      [id]
    );

    const countNum = callCountResult ? Number(callCountResult.count) : 0;

    // If zero calls, delete the game row and decrement session game count
    if (countNum === 0) {
      const gameRow = await db.queryOne<{ session_id: string }>(
        "SELECT session_id FROM games WHERE id = ?",
        [id]
      );

      if (gameRow?.session_id) {
        await db.execute(
          "UPDATE sessions SET total_games = GREATEST(0, total_games - 1) WHERE id = ?",
          [gameRow.session_id]
        );
      }

      await db.execute("DELETE FROM games WHERE id = ?", [id]);
      return NextResponse.json({ success: true, deleted: true, gameId: id });
    }

    return NextResponse.json({
      success: true,
      deleted: false,
      message: "Game has calls and was retained",
      gameId: id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
