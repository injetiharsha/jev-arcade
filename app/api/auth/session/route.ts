import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  validateKeyFormat,
  encryptApiKey,
  testApiKeyWithJev,
  computeClientFingerprint,
} from "@/lib/byok";

const FREE_TIER_LIMIT = 10;

// GET /api/auth/session - Retrieve current session access mode and remaining quota
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("jev_session_id")?.value;
    const isTrialClaimedCookie = req.cookies.get("jev_trial_claimed")?.value === "1";

    if (!sessionId) {
      return NextResponse.json({
        mode: null,
        remainingCalls: FREE_TIER_LIMIT,
        freeCallsUsed: 0,
        isTrialClaimed: isTrialClaimedCookie,
        hasSession: false,
      });
    }

    const session = await db.queryOne<{
      id: string;
      mode: string | null;
      free_calls_used: number | null;
      ended_at: string | null;
    }>("SELECT id, mode, free_calls_used, ended_at FROM sessions WHERE id = ?", [
      sessionId,
    ]);

    if (!session || session.ended_at) {
      return NextResponse.json({
        mode: null,
        remainingCalls: FREE_TIER_LIMIT,
        freeCallsUsed: 0,
        isTrialClaimed: isTrialClaimedCookie,
        hasSession: false,
      });
    }

    const mode = session.mode || "free";
    const used = Number(session.free_calls_used) || 0;
    const remaining = Math.max(0, FREE_TIER_LIMIT - used);

    return NextResponse.json({
      sessionId: session.id,
      mode,
      remainingCalls: mode === "byok" ? null : remaining,
      freeCallsUsed: used,
      isTrialClaimed: isTrialClaimedCookie || used > 0,
      hasSession: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/auth/session - Select access mode (free demo vs BYOK key)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { mode, apiKey, sessionId: clientSessionId } = body as {
      mode: "free" | "byok";
      apiKey?: string;
      sessionId?: string;
    };

    const cookieSessionId = req.cookies.get("jev_session_id")?.value;
    const targetSessionId = clientSessionId || cookieSessionId;

    if (!targetSessionId) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";
    const acceptLang = req.headers.get("accept-language") || "";
    const fingerprint = computeClientFingerprint(clientIp, userAgent, acceptLang);

    // MODE: BYOK
    if (mode === "byok") {
      if (!apiKey || !validateKeyFormat(apiKey)) {
        return NextResponse.json(
          { error: "Invalid API key format. Expected a valid TypeSafe API key." },
          { status: 400 }
        );
      }

      // Test key against TypeSafe API before accepting
      const testResult = await testApiKeyWithJev(apiKey);
      if (!testResult.valid) {
        return NextResponse.json(
          { error: testResult.error || "Failed to validate API key with TypeSafe." },
          { status: 400 }
        );
      }

      // Encrypt key for session cookie storage (never written to database or logged)
      const encryptedToken = await encryptApiKey(apiKey);

      // Persist session mode in database
      await db.execute(
        `INSERT INTO sessions (id, mode, created_at, fingerprint)
         VALUES (?, 'byok', NOW(), ?)
         ON CONFLICT(id) DO UPDATE SET mode = 'byok'`,
        [targetSessionId, fingerprint]
      );

      const response = NextResponse.json({
        success: true,
        mode: "byok",
        sessionId: targetSessionId,
        message: "API key validated. Unlimited access granted.",
      });

      // Set encrypted httpOnly session cookie
      response.cookies.set("jev_byok_token", encryptedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 2592000, // 30 days
      });

      return response;
    }

    // MODE: FREE TRIAL
    if (mode === "free") {
      // Check abuse mitigation: fingerprint lookup
      const repeatSession = await db.queryOne<{ id: string; free_calls_used: number }>(
        `SELECT id, free_calls_used FROM sessions
         WHERE fingerprint = ? AND id != ? AND free_calls_used >= 10
         ORDER BY created_at DESC LIMIT 1`,
        [fingerprint, targetSessionId]
      );

      const isClaimedCookie = req.cookies.get("jev_trial_claimed")?.value === "1";
      const isRepeatTrial = Boolean(repeatSession || isClaimedCookie);

      // Create or update session record
      await db.execute(
        `INSERT INTO sessions (id, mode, created_at, free_calls_used, fingerprint)
         VALUES (?, 'free', NOW(), 0, ?)
         ON CONFLICT(id) DO UPDATE SET mode = 'free'`,
        [targetSessionId, fingerprint]
      );

      const response = NextResponse.json({
        success: true,
        mode: "free",
        sessionId: targetSessionId,
        remainingCalls: FREE_TIER_LIMIT,
        isRepeatTrial,
      });

      // Set 1-year first-party cookie marking free trial used
      response.cookies.set("jev_trial_claimed", "1", {
        path: "/",
        maxAge: 31536000, // 1 year
        sameSite: "lax",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid mode. Choose 'free' or 'byok'." }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
