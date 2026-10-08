import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view"); // "sessions" | "games" | "calls"
    const game = searchParams.get("game");
    const mode = searchParams.get("mode");
    const correctness = searchParams.get("correctness"); // "correct", "incorrect", "unverified", "all"
    const search = searchParams.get("search");
    const sessionIdFilter = searchParams.get("sessionId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(500, parseInt(searchParams.get("limit") || "50", 10)));
    const sortBy = searchParams.get("sortBy") || "id";
    const sortDir = searchParams.get("sortDir") === "asc" ? "ASC" : "DESC";
    const isExport = searchParams.get("export") === "csv";

    // VIEW: SESSIONS
    if (view === "sessions") {
      const sessions = await db.query<{
        id: string;
        createdAt: string;
        endedAt: string | null;
        userAgent: string | null;
        totalGames: number | string;
        totalCalls: number | string;
        correctCalls: number | string;
        evaluatedCalls: number | string;
      }>(
        `SELECT s.id, s.created_at as "createdAt", s.ended_at as "endedAt", s.user_agent as "userAgent",
                COUNT(DISTINCT g.id) as "totalGames",
                COUNT(c.id) as "totalCalls",
                SUM(CASE WHEN c.is_correct = 1 THEN 1 ELSE 0 END) as "correctCalls",
                SUM(CASE WHEN c.is_correct IS NOT NULL THEN 1 ELSE 0 END) as "evaluatedCalls"
         FROM sessions s
         LEFT JOIN games g ON g.session_id = s.id
         LEFT JOIN jev_calls c ON c.session_id = s.id
         GROUP BY s.id, s.created_at, s.ended_at, s.user_agent
         ORDER BY s.created_at DESC`
      );

      const formattedSessions = await Promise.all(
        sessions.map(async (s) => {
          // Fetch games for this session
          const sessionGames = await db.query<{
            id: string;
            sessionId: string;
            gameType: string;
            startedAt: string;
            endedAt: string | null;
            result: string | null;
            totalCalls: number | string;
            correctCalls: number | string;
            evaluatedCalls: number | string;
          }>(
            `SELECT g.id, g.session_id as "sessionId", g.game_type as "gameType", g.started_at as "startedAt", g.ended_at as "endedAt", g.result,
                    COUNT(c.id) as "totalCalls",
                    SUM(CASE WHEN c.is_correct = 1 THEN 1 ELSE 0 END) as "correctCalls",
                    SUM(CASE WHEN c.is_correct IS NOT NULL THEN 1 ELSE 0 END) as "evaluatedCalls"
             FROM games g
             LEFT JOIN jev_calls c ON c.game_id = g.id
             WHERE g.session_id = ?
             GROUP BY g.id, g.session_id, g.game_type, g.started_at, g.ended_at, g.result
             ORDER BY g.started_at DESC`,
            [s.id]
          );

          const totalGamesNum = Number(s.totalGames) || 0;
          const totalCallsNum = Number(s.totalCalls) || 0;
          const correctCallsNum = Number(s.correctCalls) || 0;
          const evaluatedCallsNum = Number(s.evaluatedCalls) || 0;

          const overallAccuracy =
            evaluatedCallsNum > 0
              ? Math.round((correctCallsNum / evaluatedCallsNum) * 1000) / 10
              : null;

          return {
            sessionId: s.id,
            createdAt: s.createdAt,
            endedAt: s.endedAt,
            userAgent: s.userAgent,
            totalGames: totalGamesNum,
            totalCalls: totalCallsNum,
            correctCalls: correctCallsNum,
            evaluatedCalls: evaluatedCallsNum,
            overallAccuracy,
            games: sessionGames.map((g) => {
              const gCalls = Number(g.totalCalls) || 0;
              const gCorrect = Number(g.correctCalls) || 0;
              const gEvaluated = Number(g.evaluatedCalls) || 0;
              const gAcc =
                gEvaluated > 0
                  ? Math.round((gCorrect / gEvaluated) * 1000) / 10
                  : null;
              return {
                gameId: g.id,
                gameType: g.gameType,
                result: g.result || "in_progress",
                startedAt: g.startedAt,
                endedAt: g.endedAt,
                totalCalls: gCalls,
                accuracy: gAcc,
              };
            }),
          };
        })
      );

      return NextResponse.json({ sessions: formattedSessions });
    }

    // VIEW: GAMES
    if (view === "games") {
      let gamesQuery = `
        SELECT g.id, g.session_id as "sessionId", g.game_type as "gameType", g.started_at as "startedAt", g.ended_at as "endedAt", g.result,
               COUNT(c.id) as "totalCalls",
               SUM(CASE WHEN c.is_correct = 1 THEN 1 ELSE 0 END) as "correctCalls",
               SUM(CASE WHEN c.is_correct IS NOT NULL THEN 1 ELSE 0 END) as "evaluatedCalls"
        FROM games g
        LEFT JOIN jev_calls c ON c.game_id = g.id
      `;
      const params: string[] = [];

      if (sessionIdFilter) {
        gamesQuery += ` WHERE g.session_id = ? `;
        params.push(sessionIdFilter);
      }

      gamesQuery += ` GROUP BY g.id, g.session_id, g.game_type, g.started_at, g.ended_at, g.result ORDER BY g.started_at DESC `;

      const games = await db.query<{
        id: string;
        sessionId: string;
        gameType: string;
        startedAt: string;
        endedAt: string | null;
        result: string | null;
        totalCalls: number | string;
        correctCalls: number | string;
        evaluatedCalls: number | string;
      }>(gamesQuery, params);

      const formattedGames = await Promise.all(
        games.map(async (g) => {
          // Fetch all Jev calls within this game in chronological order
          const calls = await db.query<{
            id: number;
            stepIndex: number | null;
            questionId: string;
            choice: string;
            confidence: number;
            isCorrect: number | null;
            latencyMs: number;
            createdAt: string;
            state: string;
            instructions: string;
            criteriaJson: string;
          }>(
            `SELECT id, step_index as "stepIndex", question_id as "questionId", choice, confidence, is_correct as "isCorrect", latency_ms as "latencyMs", created_at as "createdAt", state, instructions, criteria_json as "criteriaJson"
             FROM jev_calls
             WHERE game_id = ?
             ORDER BY id ASC`,
            [g.id]
          );

          const gCalls = Number(g.totalCalls) || 0;
          const gCorrect = Number(g.correctCalls) || 0;
          const gEvaluated = Number(g.evaluatedCalls) || 0;
          const accuracy =
            gEvaluated > 0
              ? Math.round((gCorrect / gEvaluated) * 1000) / 10
              : null;

          return {
            gameId: g.id,
            sessionId: g.sessionId,
            gameType: g.gameType,
            result: g.result || "in_progress",
            startedAt: g.startedAt,
            endedAt: g.endedAt,
            totalCalls: gCalls,
            accuracy,
            calls: calls.map((c, i) => {
              let criteria = null;
              try {
                criteria = JSON.parse(c.criteriaJson);
              } catch {
                criteria = c.criteriaJson;
              }
              return {
                stepNumber: i + 1,
                id: c.id,
                questionId: c.questionId,
                choice: c.choice,
                confidence: c.confidence,
                latencyMs: c.latencyMs,
                isCorrect: c.isCorrect === 1 ? true : c.isCorrect === 0 ? false : null,
                createdAt: c.createdAt,
                state: c.state,
                instructions: c.instructions,
                criteria,
              };
            }),
          };
        })
      );

      return NextResponse.json({ games: formattedGames });
    }

    // VIEW: CALLS (Default)
    // Build WHERE conditions
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (game && game !== "all") {
      conditions.push("game = ?");
      params.push(game);
    }

    if (mode && mode !== "all") {
      conditions.push("mode = ?");
      params.push(mode);
    }

    if (correctness && correctness !== "all") {
      if (correctness === "correct") {
        conditions.push("is_correct = 1");
      } else if (correctness === "incorrect") {
        conditions.push("is_correct = 0");
      } else if (correctness === "unverified") {
        conditions.push("is_correct IS NULL");
      }
    }

    if (sessionIdFilter) {
      conditions.push("session_id = ?");
      params.push(sessionIdFilter);
    }

    if (search && search.trim() !== "") {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        "(question_id LIKE ? OR choice LIKE ? OR state LIKE ? OR instructions LIKE ? OR session_id LIKE ? OR game_id LIKE ?)"
      );
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Allowed sort columns
    const allowedSortColumns = new Set([
      "id",
      "session_id",
      "game_id",
      "game",
      "mode",
      "question_id",
      "choice",
      "confidence",
      "is_correct",
      "latency_ms",
      "created_at",
      "step_index",
    ]);
    const safeSortBy = allowedSortColumns.has(sortBy) ? sortBy : "id";

    if (isExport) {
      // Return full filtered rows as CSV
      const rows = await db.query<{
        id: number;
        session_id: string | null;
        game_id: string | null;
        game: string;
        mode: string;
        difficulty: string | null;
        step_index: number | null;
        question_id: string;
        choice: string;
        confidence: number;
        is_correct: number | null;
        latency_ms: number;
        created_at: string;
        state: string;
        instructions: string;
        criteria_json: string;
        probabilities_json: string;
      }>(
        `SELECT id, session_id, game_id, game, mode, difficulty, step_index, question_id, choice, confidence, is_correct, latency_ms, created_at, state, instructions, criteria_json, probabilities_json
         FROM jev_calls
         ${whereClause}
         ORDER BY ${safeSortBy} ${sortDir}`,
        params
      );

      const headers = [
        "ID",
        "Session ID",
        "Game ID",
        "Game",
        "Mode",
        "Difficulty",
        "Step",
        "Question ID",
        "Choice",
        "Confidence",
        "Is Correct",
        "Latency (ms)",
        "Created At",
        "State",
        "Instructions",
        "Criteria",
        "Probabilities",
      ];

      const csvLines = [
        headers.join(","),
        ...rows.map((r) => {
          const escapeCsv = (val: any) => {
            if (val === null || val === undefined) return "";
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          };
          return [
            r.id,
            escapeCsv(r.session_id),
            escapeCsv(r.game_id),
            escapeCsv(r.game),
            escapeCsv(r.mode),
            escapeCsv(r.difficulty),
            r.step_index ?? "",
            escapeCsv(r.question_id),
            escapeCsv(r.choice),
            r.confidence,
            r.is_correct ?? "",
            r.latency_ms,
            escapeCsv(r.created_at),
            escapeCsv(r.state),
            escapeCsv(r.instructions),
            escapeCsv(r.criteria_json),
            escapeCsv(r.probabilities_json),
          ].join(",");
        }),
      ];

      const csvContent = csvLines.join("\n");
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="jev_calls_export_${Date.now()}.csv"`,
        },
      });
    }

    // Total count query
    const countResult = await db.queryOne<{ total: number | string }>(
      `SELECT COUNT(*) as total FROM jev_calls ${whereClause}`,
      params
    );
    const totalCount = countResult ? Number(countResult.total) : 0;

    // Paginated rows query
    const offset = (page - 1) * limit;
    const rows = await db.query<{
      id: number;
      session_id: string | null;
      game_id: string | null;
      game: string;
      mode: string;
      difficulty: string | null;
      step_index: number | null;
      question_id: string;
      choice: string;
      confidence: number;
      is_correct: number | null;
      latency_ms: number;
      created_at: string;
      state: string;
      instructions: string;
      criteria_json: string;
      probabilities_json: string;
    }>(
      `SELECT id, session_id, game_id, game, mode, difficulty, step_index, question_id, choice, confidence, is_correct, latency_ms, created_at, state, instructions, criteria_json, probabilities_json
       FROM jev_calls
       ${whereClause}
       ORDER BY ${safeSortBy} ${sortDir}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Parse JSON fields safely
    const formattedRows = rows.map((r) => {
      let criteria = null;
      let probabilities = null;
      try {
        criteria = JSON.parse(r.criteria_json);
      } catch {
        criteria = r.criteria_json;
      }
      try {
        probabilities = JSON.parse(r.probabilities_json);
      } catch {
        probabilities = r.probabilities_json;
      }
      return {
        id: r.id,
        sessionId: r.session_id,
        gameId: r.game_id,
        game: r.game,
        mode: r.mode,
        difficulty: r.difficulty,
        stepIndex: r.step_index,
        questionId: r.question_id,
        choice: r.choice,
        confidence: r.confidence,
        isCorrect: r.is_correct === 1 ? true : r.is_correct === 0 ? false : null,
        latencyMs: Math.round(r.latency_ms * 10) / 10,
        createdAt: r.created_at,
        state: r.state,
        instructions: r.instructions,
        criteria,
        probabilities,
      };
    });

    // Compute Pivot Matrix
    const allFilteredRowsForPivot = await db.query<{
      game: string;
      confidence: number;
      is_correct: number | null;
    }>(
      `SELECT game, confidence, is_correct FROM jev_calls ${whereClause}`,
      params
    );

    const bins = [
      { label: "0-10%", min: 0.0, max: 0.1 },
      { label: "10-20%", min: 0.1, max: 0.2 },
      { label: "20-30%", min: 0.2, max: 0.3 },
      { label: "30-40%", min: 0.3, max: 0.4 },
      { label: "40-50%", min: 0.4, max: 0.5 },
      { label: "50-60%", min: 0.5, max: 0.6 },
      { label: "60-70%", min: 0.6, max: 0.7 },
      { label: "70-80%", min: 0.7, max: 0.8 },
      { label: "80-90%", min: 0.8, max: 0.9 },
      { label: "90-100%", min: 0.9, max: 1.001 },
    ];

    const gamesSet = new Set<string>();
    allFilteredRowsForPivot.forEach((r) => gamesSet.add(r.game));
    const distinctGames = Array.from(gamesSet).sort();

    const pivotData: Record<
      string,
      Record<
        string,
        {
          count: number;
          correctCount: number;
          accuracy: number | null;
        }
      >
    > = {};

    distinctGames.forEach((g) => {
      pivotData[g] = {};
      bins.forEach((b) => {
        pivotData[g][b.label] = { count: 0, correctCount: 0, accuracy: null };
      });
    });

    allFilteredRowsForPivot.forEach((row) => {
      const g = row.game;
      const conf = row.confidence;
      const isCorr = row.is_correct;

      const bin = bins.find((b) => conf >= b.min && (conf < b.max || (b.max >= 1.0 && conf <= 1.0)));
      if (bin && pivotData[g] && pivotData[g][bin.label]) {
        const cell = pivotData[g][bin.label];
        cell.count += 1;
        if (isCorr === 1) cell.correctCount += 1;
      }
    });

    // Compute accuracy percentages
    distinctGames.forEach((g) => {
      bins.forEach((b) => {
        const cell = pivotData[g][b.label];
        if (cell.count > 0) {
          cell.accuracy = Math.round((cell.correctCount / cell.count) * 1000) / 10;
        }
      });
    });

    return NextResponse.json({
      calls: formattedRows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      pivot: {
        games: distinctGames,
        bins: bins.map((b) => b.label),
        data: pivotData,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/data - Wipe all sessions, games, and telemetry calls for a fresh slate
export async function DELETE() {
  try {
    await db.execute("DELETE FROM jev_calls");
    await db.execute("DELETE FROM games");
    await db.execute("DELETE FROM sessions");
    return NextResponse.json({
      success: true,
      message: "All sessions, games, and telemetry history successfully wiped.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
