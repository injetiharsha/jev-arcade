import { NextResponse } from "next/server";
import { db } from "@/db/client";

interface JevCallRow {
  id: number;
  game: string;
  confidence: number;
  latency_ms: number;
  is_correct: number | null;
  mode: string | null;
  difficulty: string | null;
  step_index: number | null;
  created_at: string;
}

function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  const index = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return Math.round((sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight) * 100) / 100;
}

export async function GET() {
  try {
    const allRows = await db.query<JevCallRow>(
      "SELECT id, game, confidence, latency_ms, is_correct, mode, difficulty, step_index, created_at FROM jev_calls ORDER BY id ASC"
    );

    const totalCalls = allRows.length;

    if (totalCalls === 0) {
      return NextResponse.json({
        overall: {
          totalCalls: 0,
          overallAccuracy: 0,
          avgConfidence: 0,
          avgLatencyMs: 0,
          p50LatencyMs: 0,
          p95LatencyMs: 0,
        },
        byGame: {},
        accuracyByGame: [],
        calibration: {
          bins: [],
          expectedCalibrationError: 0,
        },
        latencyOverTime: [],
        latencyDistribution: [],
        confidenceHistogram: [],
        sudokuDifficultyAccuracy: [],
      });
    }

    // 1. Overall stats
    const latencies = allRows.map((r) => r.latency_ms).sort((a, b) => a - b);
    const p50LatencyMs = percentile(latencies, 50);
    const p95LatencyMs = percentile(latencies, 95);

    const sumLatency = latencies.reduce((a, b) => a + b, 0);
    const avgLatencyMs = Math.round((sumLatency / totalCalls) * 100) / 100;

    const sumConfidence = allRows.reduce((a, b) => a + b.confidence, 0);
    const avgConfidence = Math.round((sumConfidence / totalCalls) * 1000) / 1000;

    const evaluatedRows = allRows.filter((r) => r.is_correct !== null);
    const totalEvaluated = evaluatedRows.length;
    const correctRows = evaluatedRows.filter((r) => r.is_correct === 1);
    const overallAccuracy =
      totalEvaluated > 0
        ? Math.round((correctRows.length / totalEvaluated) * 1000) / 1000
        : 0;

    // 2. By Game breakdown
    const gameMap = new Map<string, JevCallRow[]>();
    for (const row of allRows) {
      if (!gameMap.has(row.game)) {
        gameMap.set(row.game, []);
      }
      gameMap.get(row.game)!.push(row);
    }

    const byGame: Record<
      string,
      {
        totalCalls: number;
        accuracy: number;
        avgConfidence: number;
        avgLatencyMs: number;
      }
    > = {};

    const accuracyByGame: Array<{
      game: string;
      totalCalls: number;
      accuracy: number;
      avgConfidence: number;
      avgLatencyMs: number;
    }> = [];

    for (const [gameName, rows] of gameMap.entries()) {
      const gameTotal = rows.length;
      const gameEvaluated = rows.filter((r) => r.is_correct !== null);
      const gameCorrect = gameEvaluated.filter((r) => r.is_correct === 1);
      const gameAccuracy =
        gameEvaluated.length > 0
          ? Math.round((gameCorrect.length / gameEvaluated.length) * 1000) / 1000
          : 0;
      const gameAvgConf =
        Math.round((rows.reduce((a, b) => a + b.confidence, 0) / gameTotal) * 1000) / 1000;
      const gameAvgLat =
        Math.round((rows.reduce((a, b) => a + b.latency_ms, 0) / gameTotal) * 100) / 100;

      byGame[gameName] = {
        totalCalls: gameTotal,
        accuracy: gameAccuracy,
        avgConfidence: gameAvgConf,
        avgLatencyMs: gameAvgLat,
      };

      accuracyByGame.push({
        game: gameName,
        totalCalls: gameTotal,
        accuracy: Math.round(gameAccuracy * 1000) / 10,
        avgConfidence: Math.round(gameAvgConf * 1000) / 10,
        avgLatencyMs: gameAvgLat,
      });
    }

    // 3. Calibration Curve
    const binBuckets: Array<{
      range: string;
      rows: JevCallRow[];
    }> = [
      { range: "0.0-0.1", rows: [] },
      { range: "0.1-0.2", rows: [] },
      { range: "0.2-0.3", rows: [] },
      { range: "0.3-0.4", rows: [] },
      { range: "0.4-0.5", rows: [] },
      { range: "0.5-0.6", rows: [] },
      { range: "0.6-0.7", rows: [] },
      { range: "0.7-0.8", rows: [] },
      { range: "0.8-0.9", rows: [] },
      { range: "0.9-1.0", rows: [] },
    ];

    for (const r of evaluatedRows) {
      const binIdx = Math.min(9, Math.max(0, Math.floor(r.confidence * 10)));
      binBuckets[binIdx].rows.push(r);
    }

    const calibrationBins: Array<{
      range: string;
      count: number;
      avgConfidence: number;
      actualAccuracy: number;
    }> = [];

    let totalWeightedDiff = 0;

    for (const b of binBuckets) {
      if (b.rows.length === 0) continue;

      const binCount = b.rows.length;
      const binAvgConf =
        b.rows.reduce((sum, row) => sum + row.confidence, 0) / binCount;
      const binCorrectCount = b.rows.filter((row) => row.is_correct === 1).length;
      const binActualAccuracy = binCorrectCount / binCount;

      totalWeightedDiff += binCount * Math.abs(binAvgConf - binActualAccuracy);

      calibrationBins.push({
        range: b.range,
        count: binCount,
        avgConfidence: Math.round(binAvgConf * 1000) / 1000,
        actualAccuracy: Math.round(binActualAccuracy * 1000) / 1000,
      });
    }

    const expectedCalibrationError =
      totalEvaluated > 0
        ? Math.round((totalWeightedDiff / totalEvaluated) * 1000) / 1000
        : 0;

    // 4. Latency Over Time (last 200 calls)
    const recentRows = await db.query<{
      id: number;
      sessionId: string | null;
      gameId: string | null;
      game: string;
      latencyMs: number;
      confidence: number;
      choice: string;
      isCorrect: number | null;
      questionId: string;
      createdAt: string;
      instructions: string;
      state: string;
      criteriaJson: string;
    }>(
      `SELECT id, session_id as "sessionId", game_id as "gameId", game,
              latency_ms as "latencyMs", confidence, choice, is_correct as "isCorrect",
              question_id as "questionId", created_at as "createdAt",
              instructions, state, criteria_json as "criteriaJson"
       FROM jev_calls
       ORDER BY id DESC LIMIT 200`
    );

    const latencyOverTime = recentRows.reverse().map((r) => {
      let criteria = null;
      try {
        criteria = JSON.parse(r.criteriaJson);
      } catch {
        criteria = r.criteriaJson;
      }
      return {
        id: r.id,
        sessionId: r.sessionId,
        gameId: r.gameId,
        game: r.game,
        latencyMs: Math.round(r.latencyMs * 10) / 10,
        confidence: r.confidence,
        choice: r.choice,
        isCorrect: r.isCorrect === 1 ? true : r.isCorrect === 0 ? false : null,
        questionId: r.questionId,
        createdAt: r.createdAt,
        instructions: r.instructions,
        state: r.state,
        criteria,
      };
    });

    // 5. Latency Distribution Histogram (<200ms, 200-500ms, 500ms-1s, 1-2s, 2s+)
    const latencyBuckets = [
      { range: "<200ms", count: 0, min: 0, max: 200 },
      { range: "200-500ms", count: 0, min: 200, max: 500 },
      { range: "500ms-1s", count: 0, min: 500, max: 1000 },
      { range: "1-2s", count: 0, min: 1000, max: 2000 },
      { range: "2s+", count: 0, min: 2000, max: Infinity },
    ];

    for (const r of allRows) {
      const lat = r.latency_ms;
      if (lat < 200) latencyBuckets[0].count++;
      else if (lat < 500) latencyBuckets[1].count++;
      else if (lat < 1000) latencyBuckets[2].count++;
      else if (lat < 2000) latencyBuckets[3].count++;
      else latencyBuckets[4].count++;
    }

    const latencyDistribution = latencyBuckets.map((b) => ({
      range: b.range,
      count: b.count,
    }));

    // 6. Confidence Histogram (0-10%, 10-20%, ..., 90-100%)
    const confBuckets = [
      { range: "0-10%", count: 0 },
      { range: "10-20%", count: 0 },
      { range: "20-30%", count: 0 },
      { range: "30-40%", count: 0 },
      { range: "40-50%", count: 0 },
      { range: "50-60%", count: 0 },
      { range: "60-70%", count: 0 },
      { range: "70-80%", count: 0 },
      { range: "80-90%", count: 0 },
      { range: "90-100%", count: 0 },
    ];

    for (const r of allRows) {
      const idx = Math.min(9, Math.max(0, Math.floor(r.confidence * 10)));
      confBuckets[idx].count++;
    }

    const confidenceHistogram = confBuckets;

    // 7. Accuracy by Difficulty (Sudoku only)
    const sudokuRows = allRows.filter((r) => r.game === "sudoku" && r.is_correct !== null);
    const diffMap = new Map<string, { total: number; correct: number }>();

    for (const r of sudokuRows) {
      const diff = r.difficulty || "standard";
      if (!diffMap.has(diff)) {
        diffMap.set(diff, { total: 0, correct: 0 });
      }
      const item = diffMap.get(diff)!;
      item.total++;
      if (r.is_correct === 1) item.correct++;
    }

    const sudokuDifficultyAccuracy = ["easy", "medium", "hard", "random"]
      .filter((d) => diffMap.has(d))
      .map((difficulty) => {
        const data = diffMap.get(difficulty)!;
        return {
          difficulty,
          total: data.total,
          accuracy: Math.round((data.correct / data.total) * 1000) / 10,
        };
      });

    return NextResponse.json({
      overall: {
        totalCalls,
        overallAccuracy,
        avgConfidence,
        avgLatencyMs,
        p50LatencyMs,
        p95LatencyMs,
      },
      byGame,
      accuracyByGame,
      calibration: {
        bins: calibrationBins,
        expectedCalibrationError,
      },
      latencyOverTime,
      latencyDistribution,
      confidenceHistogram,
      sudokuDifficultyAccuracy,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
