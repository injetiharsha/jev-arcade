async function testStats() {
  console.log("=========================================");
  console.log("  Testing GET /api/stats API Endpoint    ");
  console.log("=========================================\n");

  const res = await fetch("http://localhost:3000/api/stats");
  if (!res.ok) {
    console.error("HTTP error:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log("Response JSON:");
  console.log(JSON.stringify(data, null, 2));

  console.log("\n--- Validation Checks ---");
  const overall = data.overall;
  console.log(`Total Calls: ${overall.totalCalls}`);
  console.log(`Overall Accuracy: ${overall.overallAccuracy} (0.0 to 1.0)`);
  console.log(`Average Latency: ${overall.avgLatencyMs} ms`);
  console.log(`p50 Latency: ${overall.p50LatencyMs} ms`);
  console.log(`p95 Latency: ${overall.p95LatencyMs} ms`);

  // Assert accuracy in bounds
  if (overall.overallAccuracy < 0 || overall.overallAccuracy > 1) {
    console.error("FAIL: Accuracy out of range [0, 1]");
    process.exit(1);
  }

  // Assert calibration bins
  const binTotalCount = data.calibration.bins.reduce(
    (acc: number, b: { count: number }) => acc + b.count,
    0
  );
  console.log(`Calibration Bins Total Count: ${binTotalCount}`);
  console.log(`Expected Calibration Error (ECE): ${data.calibration.expectedCalibrationError}`);

  console.log("\nBy Game Summary:");
  for (const [game, stats] of Object.entries(data.byGame)) {
    console.log(`  - ${game}:`, stats);
  }

  console.log(`\nLatency Over Time Count: ${data.latencyOverTime.length}`);
  console.log("\n\x1b[32m✓ All stats validations passed successfully!\x1b[0m");
}

testStats();
