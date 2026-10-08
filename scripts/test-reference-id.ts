import { generateReferenceId } from "../lib/session";

function testReferenceId() {
  console.log("=========================================");
  console.log("  Testing Reference ID Generation Format ");
  console.log("=========================================\n");

  const testCases = [
    {
      name: "User Spec Example: Sep 21 2026, 9:12:23 AM",
      date: new Date(2026, 8, 21, 9, 12, 23), // Month is 0-indexed (8 = Sep)
      expected: "210926091223A",
    },
    {
      name: "PM Example: Sep 21 2026, 2:05:09 PM",
      date: new Date(2026, 8, 21, 14, 5, 9),
      expected: "210926020509P",
    },
    {
      name: "Midnight: Jan 1 2027, 12:00:00 AM",
      date: new Date(2027, 0, 1, 0, 0, 0),
      expected: "010127120000A",
    },
    {
      name: "Noon: Jul 4 2026, 12:00:00 PM",
      date: new Date(2026, 6, 4, 12, 0, 0),
      expected: "040726120000P",
    },
    {
      name: "Late Night: Dec 31 2026, 11:59:59 PM",
      date: new Date(2026, 11, 31, 23, 59, 59),
      expected: "311226115959P",
    },
  ];

  let allPassed = true;

  for (const tc of testCases) {
    const actual = generateReferenceId(tc.date);
    const passed = actual === tc.expected && actual.length === 13;
    if (!passed) allPassed = false;

    console.log(`Test: ${tc.name}`);
    console.log(`  Expected : "${tc.expected}" (Length: ${tc.expected.length})`);
    console.log(`  Actual   : "${actual}" (Length: ${actual.length})`);
    console.log(`  Status   : ${passed ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}\n`);
  }

  // Also test current time generation
  const liveId = generateReferenceId();
  console.log(`Live Generated Reference ID: "${liveId}" (Length: ${liveId.length})`);
  if (liveId.length !== 13) {
    allPassed = false;
  }

  console.log("-----------------------------------------");
  if (allPassed) {
    console.log("\x1b[32m✓ ALL REFERENCE ID TESTS PASSED!\x1b[0m");
    console.log("-----------------------------------------\n");
  } else {
    console.log("\x1b[31m✗ SOME TESTS FAILED!\x1b[0m");
    console.log("-----------------------------------------\n");
    process.exit(1);
  }
}

testReferenceId();
