import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";

// POST /api/session/terminate - Mark session ended, abandon active games, clear cookie
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sessionId, gameId } = body as { sessionId?: string; gameId?: string };

    const cookieSessionId = req.cookies.get("jev_session_id")?.value;
    const targetSessionId = sessionId || cookieSessionId;

    if (!targetSessionId) {
      return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
    }

    // 1. Mark session as ended
    await db.execute(
      `UPDATE sessions
       SET ended_at = NOW()
       WHERE id = ?`,
      [targetSessionId]
    );

    // 2. Mark any in-progress games for this session as abandoned
    await db.execute(
      `UPDATE games
       SET result = 'abandoned', completed_at = NOW()
       WHERE session_id = ? AND (result = 'in_progress' OR result IS NULL)`,
      [targetSessionId]
    );

    // 3. Response with expired cookie header
    const response = NextResponse.json({
      success: true,
      message: "Session terminated successfully",
      sessionId: targetSessionId,
    });

    response.cookies.set("jev_session_id", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
