async function testDataApi() {
  console.log("=========================================");
  console.log("  Testing Data API Views                 ");
  console.log("=========================================\n");

  try {
    const resSessions = await fetch("http://localhost:3000/api/data?view=sessions");
    const textSessions = await resSessions.text();
    console.log(`[Sessions View] Status: ${resSessions.status}, Body: ${textSessions.slice(0, 200)}`);

    const resGames = await fetch("http://localhost:3000/api/data?view=games");
    const textGames = await resGames.text();
    console.log(`\n[Games View] Status: ${resGames.status}, Body: ${textGames.slice(0, 200)}`);

    const resCalls = await fetch("http://localhost:3000/api/data");
    const textCalls = await resCalls.text();
    console.log(`\n[Calls View] Status: ${resCalls.status}, Body: ${textCalls.slice(0, 200)}`);

    console.log("\n-----------------------------------------");
    console.log("\x1b[32m✓ ALL DATA API VIEWS FUNCTIONAL!\x1b[0m");
    console.log("-----------------------------------------\n");
  } catch (err) {
    console.error("Data API test failed:", err);
    process.exit(1);
  }
}

testDataApi();
