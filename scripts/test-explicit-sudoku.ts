async function testExplicitSudoku() {
  const puzzle = [
    [4, 0, 6, 0, 0, 0, 9, 0, 8],
    [2, 3, 0, 0, 0, 0, 7, 0, 0],
    [0, 0, 0, 0, 6, 0, 0, 5, 0],
    [8, 0, 1, 0, 0, 2, 0, 0, 0],
    [0, 9, 0, 0, 7, 5, 0, 0, 0],
    [0, 0, 3, 0, 0, 0, 6, 2, 0],
    [3, 0, 0, 1, 0, 8, 0, 7, 6],
    [5, 0, 0, 7, 0, 0, 0, 0, 2],
    [1, 6, 0, 0, 4, 9, 0, 0, 0],
  ];

  // We know the full solution from previous run had 8 at [1][4]
  const solution = [
    [4, 5, 6, 2, 3, 7, 9, 1, 8],
    [2, 3, 8, 9, 8, 1, 7, 6, 4], // target is [1][4] = 8
    [9, 1, 7, 4, 6, 8, 2, 5, 3],
    [8, 7, 1, 6, 9, 2, 3, 4, 5],
    [6, 9, 2, 3, 7, 5, 4, 8, 1],
    [4, 4, 3, 8, 1, 4, 6, 2, 9],
    [3, 2, 9, 1, 5, 8, 0, 7, 6],
    [5, 8, 4, 7, 2, 6, 1, 3, 2],
    [1, 6, 5, 0, 4, 9, 8, 0, 7],
  ];
  solution[1][4] = 8;

  console.log("Calling POST http://localhost:3000/api/sudoku/ask-cell for row 1, col 4 (Row 2, Column 5)...");

  const res = await fetch("http://localhost:3000/api/sudoku/ask-cell", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      puzzle,
      solution,
      row: 1,
      col: 4,
    }),
  });

  const data = await res.json();
  console.log("\nResponse Received:");
  console.log(JSON.stringify(data, null, 2));
}

testExplicitSudoku();
