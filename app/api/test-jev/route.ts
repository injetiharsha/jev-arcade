import { NextResponse } from "next/server";
import { askJev } from "@/lib/jev";
import { db } from "@/db/client";

export async function GET() {
  try {
    const result = await askJev({
      game: "urgency_test",
      state: "The customer says the app crashed twice today and they can't log in.",
      questionId: "urgency",
      instructions: "How urgent is this issue?",
      criteria: {
        low: null,
        medium: null,
        high: null,
      },
      checkCorrect: (choice) => choice === "high",
    });

    // Query the latest logged row to verify DB insertion
    const lastRow = await db.queryOne("SELECT * FROM jev_calls ORDER BY id DESC LIMIT 1");

    return NextResponse.json({
      success: true,
      result,
      dbLoggedRow: lastRow,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
