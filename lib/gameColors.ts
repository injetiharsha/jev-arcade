/**
 * Unified game color mappings and display metadata across the entire Jev Arcade.
 * Ensures consistent visual branding on charts, tables, traces, and indicators.
 */

export const GAME_COLORS: Record<string, string> = {
  sudoku: "#a855f7", // Purple-500
  tictactoe: "#ec4899", // Pink-500
  urgency_test: "#0284c7", // Sky-600
  chess: "#10b981", // Emerald-500 (Future)
  wordle: "#f59e0b", // Amber-500 (Future)
};

export const GAME_DISPLAY_NAMES: Record<string, string> = {
  sudoku: "Sudoku",
  tictactoe: "Tic-Tac-Toe",
  urgency_test: "Urgency Benchmark",
  chess: "Chess Tactics",
  wordle: "Wordle",
};

/**
 * Returns the assigned color for a game, or a distinct fallback for unknown/future games.
 */
export function getGameColor(game: string): string {
  const normalized = game.toLowerCase();
  if (GAME_COLORS[normalized]) {
    return GAME_COLORS[normalized];
  }
  // Deterministic fallback hash for future games
  const fallbackColors = [
    "#06b6d4", // cyan
    "#8b5cf6", // violet
    "#f43f5e", // rose
    "#10b981", // emerald
    "#eab308", // yellow
    "#3b82f6", // blue
  ];
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return fallbackColors[Math.abs(hash) % fallbackColors.length];
}

/**
 * Returns a human-friendly display name for a game identifier.
 */
export function getGameDisplayName(game: string): string {
  const normalized = game.toLowerCase();
  return GAME_DISPLAY_NAMES[normalized] || game.charAt(0).toUpperCase() + game.slice(1);
}
