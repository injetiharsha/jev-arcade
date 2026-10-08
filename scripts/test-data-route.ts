async function testDataRoute() {
  console.log("Testing GET /api/data endpoint...");
  const res = await fetch("http://localhost:3000/api/data?page=1&limit=10");
  if (!res.ok) {
    const errText = await res.text();
    console.error("HTTP error:", res.status, errText);
    throw new Error(`HTTP error: ${res.status} - ${errText}`);
  }
  const data = await res.json();
  console.log("Total Count:", data.pagination.totalCount);
  console.log("Total Pages:", data.pagination.totalPages);
  console.log("Rows returned:", data.rows.length);
  if (data.rows.length > 0) {
    console.log("Sample row #1:", {
      id: data.rows[0].id,
      game: data.rows[0].game,
      mode: data.rows[0].mode,
      choice: data.rows[0].choice,
      confidence: data.rows[0].confidence,
      isCorrect: data.rows[0].isCorrect,
      latencyMs: data.rows[0].latencyMs,
    });
  }

  console.log("\nPivot Games:", data.pivot.games);
  console.log("Pivot Bins:", data.pivot.bins);

  console.log("\nTesting CSV export...");
  const csvRes = await fetch("http://localhost:3000/api/data?export=csv&limit=5");
  if (!csvRes.ok) {
    throw new Error(`CSV HTTP error: ${csvRes.status}`);
  }
  const csvText = await csvRes.text();
  const first3Lines = csvText.split("\n").slice(0, 3).join("\n");
  console.log("CSV Header & Sample Rows:\n", first3Lines);

  console.log("\n✓ ALL DATA ROUTE TESTS PASSED!");
}

testDataRoute().catch(console.error);
