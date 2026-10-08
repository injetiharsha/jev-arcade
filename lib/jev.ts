import "server-only";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { generateReferenceId } from "@/lib/session";
import { decryptApiKey } from "@/lib/byok";

export interface AskJevParams {
  sessionId?: string;
  gameId?: string;
  game: string;
  state: string;
  questionId: string;
  instructions: string;
  criteria: Record<string, string | null>;
  checkCorrect?: (choice: string) => boolean;
  timeoutMs?: number;
  mode?: "manual" | "autocomplete";
  difficulty?: string;
  stepIndex?: number;
}

export interface AskJevResult {
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
  latencyMs: number;
  isCorrect?: boolean | null;
}

const SYSTEM_ONE_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const DEFAULT_TIMEOUT_MS = 15000;
const FREE_TIER_CALL_LIMIT = 10;

export async function askJev(params: AskJevParams): Promise<AskJevResult> {
  const {
    sessionId,
    gameId,
    game,
    state,
    questionId,
    instructions,
    criteria,
    checkCorrect,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    mode = "manual",
    difficulty,
    stepIndex,
  } = params;

  // Validation guards
  if (!state || typeof state !== "string") {
    throw new Error("Invalid state: state must be a non-empty string.");
  }

  if (!criteria || Object.keys(criteria).length === 0) {
    throw new Error("Invalid criteria: question must have at least one choice option.");
  }

  // 1. Determine API key & Enforce Free-Tier Usage Cap
  let apiKey: string | null = null;
  let isByok = false;

  try {
    const cookieStore = await cookies();
    const byokToken = cookieStore.get("jev_byok_token")?.value;
    if (byokToken) {
      const decrypted = await decryptApiKey(byokToken);
      if (decrypted) {
        apiKey = decrypted;
        isByok = true;
      }
    }
  } catch {
    // Non-request context fallback (e.g. test scripts)
  }

  // If not BYOK, enforce free-tier quota against session in DB
  if (!isByok) {
    apiKey = process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY || null;
    if (!apiKey) {
      throw new Error("Missing TYPESAFE_API_KEY in server environment.");
    }

    if (sessionId) {
      const sessionRow = await db.queryOne<{
        mode: string | null;
        free_calls_used: number | null;
      }>("SELECT mode, free_calls_used FROM sessions WHERE id = ?", [sessionId]);

      const usedCalls = Number(sessionRow?.free_calls_used) || 0;
      if (usedCalls >= FREE_TIER_CALL_LIMIT) {
        const err = new Error(
          `Free trial limit of ${FREE_TIER_CALL_LIMIT} Jev calls reached. Please enter your own TypeSafe API key to continue playing.`
        );
        (err as any).statusCode = 403;
        (err as any).code = "FREE_LIMIT_REACHED";
        throw err;
      }

      // Increment free-tier call count
      await db.execute(
        "UPDATE sessions SET free_calls_used = COALESCE(free_calls_used, 0) + 1 WHERE id = ?",
        [sessionId]
      );
    }
  }

  const payload = {
    state,
    model: "jev-latest",
    questions: {
      [questionId]: {
        type: "choice",
        instructions,
        criteria,
      },
    },
  };

  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(SYSTEM_ONE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`TypeSafe API request timed out after ${timeoutMs}ms.`);
    }
    throw new Error(
      `TypeSafe API network connection failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `TypeSafe API error (${response.status} ${response.statusText}): ${errorBody}`
    );
  }

  const data = await response.json();
  const answer = data.answers?.[questionId];

  if (!answer || answer.type !== "choice" || typeof answer.choice !== "string") {
    throw new Error(
      `Unexpected API response shape for question "${questionId}": ${JSON.stringify(data)}`
    );
  }

  const choice: string = answer.choice;
  const confidence: number = typeof answer.confidence === "number" ? answer.confidence : 0;
  const probabilities: Record<string, number> = answer.probabilities || {};

  // Probability distribution sum check (0.01 tolerance)
  const probValues = Object.values(probabilities);
  if (probValues.length > 0) {
    const probSum = probValues.reduce((sum, val) => sum + (typeof val === "number" ? val : 0), 0);
    if (Math.abs(probSum - 1.0) > 0.01) {
      console.warn(
        `[Jev Calibration Warning] Probabilities for question "${questionId}" sum to ${probSum.toFixed(
          4
        )} (expected 1.0 ± 0.01). Game: "${game}"`
      );
    }
  }

  let isCorrectValue: number | null = null;
  let isCorrectResult: boolean | null = null;

  if (typeof checkCorrect === "function") {
    try {
      const isCorrect = checkCorrect(choice);
      isCorrectResult = Boolean(isCorrect);
      isCorrectValue = isCorrectResult ? 1 : 0;
    } catch (cbErr) {
      console.error("[Jev Error] checkCorrect callback threw error:", cbErr);
    }
  }

  // Persist successful call to database
  try {
    let effectiveSessionId = sessionId;

    // Ensure session exists if provided and is not terminated
    if (effectiveSessionId) {
      const existingSession = await db.queryOne<{ id: string; ended_at: string | null }>(
        "SELECT id, ended_at FROM sessions WHERE id = ?",
        [effectiveSessionId]
      );
      if (!existingSession) {
        await db.execute(
          `INSERT INTO sessions (id, created_at)
           VALUES (?, NOW())
           ON CONFLICT(id) DO NOTHING`,
          [effectiveSessionId]
        );
      } else if (existingSession.ended_at) {
        // Session was previously terminated: allocate a fresh session ID
        effectiveSessionId = generateReferenceId();
        await db.execute(
          `INSERT INTO sessions (id, created_at)
           VALUES (?, NOW())
           ON CONFLICT(id) DO NOTHING`,
          [effectiveSessionId]
        );
      }
    }

    // Ensure game exists if provided
    if (gameId && effectiveSessionId) {
      await db.execute(
        `INSERT INTO games (id, session_id, game_type, started_at)
         VALUES (?, ?, ?, NOW())
         ON CONFLICT(id) DO NOTHING`,
        [gameId, effectiveSessionId, game]
      );
    }

    await db.execute(
      `INSERT INTO jev_calls (
        session_id,
        game_id,
        game,
        state,
        question_id,
        instructions,
        criteria_json,
        choice,
        confidence,
        probabilities_json,
        latency_ms,
        is_correct,
        mode,
        difficulty,
        step_index,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        effectiveSessionId ?? null,
        gameId ?? null,
        game,
        state,
        questionId,
        instructions,
        JSON.stringify(criteria),
        choice,
        confidence,
        JSON.stringify(probabilities),
        latencyMs,
        isCorrectValue,
        mode,
        difficulty ?? null,
        typeof stepIndex === "number" ? stepIndex : null,
      ]
    );
  } catch (dbErr) {
    console.error("[Jev DB Error] Failed to persist call to database:", dbErr);
  }

  return {
    choice,
    confidence,
    probabilities,
    latencyMs,
    isCorrect: isCorrectResult,
  };
}
