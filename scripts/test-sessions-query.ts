import { db } from "../db/client";

async function run() {
  try {
    console.log("Testing sessions query...");
    const sessions = await db.query(
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
    console.log("Sessions result:", sessions);

    for (const s of sessions) {
      const sessionGames = await db.query(
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
      console.log("Session games for", s.id, ":", sessionGames.length);
    }
  } catch (err) {
    console.error("Query Error:", err);
  }
}

run();
