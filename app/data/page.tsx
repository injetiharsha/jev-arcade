"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Download,
  Filter,
  Layers,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  X,
  Search,
  Table as TableIcon,
  Grid,
  Fingerprint,
  Gamepad2,
  Calendar,
  Activity,
  Award,
  Terminal,
} from "lucide-react";

interface TelemetryRow {
  id: number;
  sessionId?: string | null;
  gameId?: string | null;
  game: string;
  mode: string;
  difficulty: string | null;
  stepIndex: number | null;
  questionId: string;
  choice: string;
  confidence: number;
  isCorrect: boolean | null;
  latencyMs: number;
  createdAt: string;
  state: string;
  instructions: string;
  criteria: Record<string, string | null> | null;
  probabilities: Record<string, number> | null;
}

interface GameCall {
  stepNumber: number;
  id: number;
  questionId: string;
  choice: string;
  confidence: number;
  latencyMs: number;
  isCorrect: boolean | null;
  createdAt: string;
  state: string;
  instructions: string;
  criteria: Record<string, string | null> | null;
}

interface GameItem {
  gameId: string;
  sessionId: string;
  gameType: string;
  result: string;
  startedAt: string;
  endedAt: string | null;
  totalCalls: number;
  accuracy: number | null;
  calls?: GameCall[];
}

interface SessionItem {
  sessionId: string;
  createdAt: string;
  endedAt?: string | null;
  totalGames: number;
  totalCalls: number;
  accuracy: number | null;
  games: GameItem[];
}

interface PivotResult {
  bins: string[];
  games: string[];
  data: Record<
    string,
    Record<
      string,
      {
        count: number;
        correctCount: number;
        accuracy: number | null;
      }
    >
  >;
}

export default function DataLogPage() {
  // Navigation View
  const [activeTab, setActiveTab] = useState<"sessions" | "games" | "calls" | "pivot">("sessions");

  // Sessions & Games state
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [games, setGames] = useState<GameItem[]>([]);
  const [expandedSessionIds, setExpandedSessionIds] = useState<Record<string, boolean>>({});
  const [expandedGameIds, setExpandedGameIds] = useState<Record<string, boolean>>({});
  const [selectedSessionForFilter, setSelectedSessionForFilter] = useState<string | null>(null);

  // Raw Calls state
  const [rows, setRows] = useState<TelemetryRow[]>([]);
  const [pivot, setPivot] = useState<PivotResult | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 1,
  });

  // Filter States for Raw Calls
  const [gameFilter, setGameFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [correctnessFilter, setCorrectnessFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Modals & Inspection
  const [selectedDetailsRow, setSelectedDetailsRow] = useState<TelemetryRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch Sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/data?view=sessions");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  }, []);

  // 2. Fetch Games
  const fetchGames = useCallback(async (sessId?: string | null) => {
    try {
      const url = sessId
        ? `/api/data?view=games&sessionId=${encodeURIComponent(sessId)}`
        : "/api/data?view=games";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGames(data.games || []);
    } catch (err) {
      console.error("Failed to load games:", err);
    }
  }, []);

  // 3. Fetch Raw Calls & Pivot
  const fetchRawCalls = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        game: gameFilter,
        mode: modeFilter,
        correctness: correctnessFilter,
        search: searchQuery,
        sortBy,
        sortDir,
      });
      if (selectedSessionForFilter) {
        params.set("sessionId", selectedSessionForFilter);
      }

      const res = await fetch(`/api/data?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(data.rows || []);
      setPagination(data.pagination);
      setPivot(data.pivot);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load telemetry logs");
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    gameFilter,
    modeFilter,
    correctnessFilter,
    searchQuery,
    sortBy,
    sortDir,
    selectedSessionForFilter,
  ]);

  const loadActiveTabData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (activeTab === "sessions") {
        await fetchSessions();
      } else if (activeTab === "games") {
        await fetchGames(selectedSessionForFilter);
      } else {
        await fetchRawCalls();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, fetchSessions, fetchGames, fetchRawCalls, selectedSessionForFilter]);

  useEffect(() => {
    loadActiveTabData();
  }, [loadActiveTabData]);

  const handleExportCsv = () => {
    const params = new URLSearchParams({
      game: gameFilter,
      mode: modeFilter,
      correctness: correctnessFilter,
      search: searchQuery,
      sortBy,
      sortDir,
      export: "csv",
    });
    if (selectedSessionForFilter) {
      params.set("sessionId", selectedSessionForFilter);
    }
    window.open(`/api/data?${params.toString()}`, "_blank");
  };

  const toggleSessionExpand = (sessId: string) => {
    setExpandedSessionIds((prev) => ({
      ...prev,
      [sessId]: !prev[sessId],
    }));
  };

  const toggleGameExpand = (gId: string) => {
    setExpandedGameIds((prev) => ({
      ...prev,
      [gId]: !prev[gId],
    }));
  };

  const filterBySession = (sessId: string) => {
    setSelectedSessionForFilter(sessId);
    setActiveTab("games");
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs px-2.5 py-1 rounded-md bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
            >
              ← Arcade Home
            </Link>
            <span className="text-xs text-pink-600 dark:text-pink-400 font-mono tracking-wide uppercase bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
              Audit & Telemetry Hub
            </span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mt-1">
            Telemetry Data Explorer
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Inspect structured session history, game lifecycles, and every raw decision trace logged by Jev.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={async () => {
              if (window.confirm("Are you sure you want to wipe all session and telemetry history? This cannot be undone.")) {
                try {
                  const res = await fetch("/api/data", { method: "DELETE" });
                  if (res.ok) {
                    alert("Database successfully wiped to a clean slate.");
                    loadActiveTabData();
                  }
                } catch (e) {
                  alert("Failed to wipe database");
                }
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
            title="Reset telemetry database to a completely blank slate"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Wipe History</span>
          </button>

          <button
            onClick={loadActiveTabData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Error Alert */}
      {errorMsg && (
        <div className="w-full max-w-7xl mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={loadActiveTabData} className="text-xs underline hover:opacity-80">
            Retry
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="w-full max-w-7xl flex items-center justify-between border-b border-gray-200 dark:border-white/10 mb-6 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab("sessions");
              setSelectedSessionForFilter(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "sessions"
                ? "bg-purple-600 text-white shadow"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Session History</span>
          </button>

          <button
            onClick={() => setActiveTab("games")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "games"
                ? "bg-purple-600 text-white shadow"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Game History</span>
            {selectedSessionForFilter && (
              <span className="ml-1 px-1.5 py-0.2 bg-purple-950 text-[10px] rounded border border-purple-400/40">
                Filtered: {selectedSessionForFilter.slice(0, 6)}...
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("calls")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "calls"
                ? "bg-purple-600 text-white shadow"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Raw Telemetry Calls</span>
          </button>

          <button
            onClick={() => setActiveTab("pivot")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "pivot"
                ? "bg-purple-600 text-white shadow"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Confidence Pivot Matrix</span>
          </button>
        </div>

        {selectedSessionForFilter && (
          <button
            onClick={() => {
              setSelectedSessionForFilter(null);
              fetchGames(null);
            }}
            className="text-xs text-pink-500 hover:underline flex items-center gap-1 font-mono cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Clear Session Filter
          </button>
        )}
      </div>

      {/* VIEW 1: SESSION HISTORY */}
      {activeTab === "sessions" && (
        <div className="w-full max-w-7xl space-y-4">
          {sessions.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 text-gray-500">
              <Fingerprint className="w-10 h-10 mx-auto mb-3 text-purple-400/50" />
              <p className="text-sm font-semibold">No browser sessions recorded yet.</p>
              <p className="text-xs text-gray-400 mt-1">Play a match in Tic-Tac-Toe or Sudoku to initiate a session.</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const isExpanded = !!expandedSessionIds[sess.sessionId];

              return (
                <div
                  key={sess.sessionId}
                  className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Session Header Card */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSessionExpand(sess.sessionId)}
                        className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                            Session: {sess.sessionId}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-mono font-semibold border border-purple-500/20">
                            13-CHAR ID
                          </span>
                          {sess.endedAt ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-mono font-bold border border-rose-500/20">
                              Ended
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-1 font-mono">
                          <span>Started: {sess.createdAt}</span>
                          <span>•</span>
                          <span>{sess.totalGames} game{sess.totalGames === 1 ? "" : "s"}</span>
                          <span>•</span>
                          <span>{sess.totalCalls} Jev call{sess.totalCalls === 1 ? "" : "s"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[10px] text-gray-400 uppercase font-mono">Session Accuracy</div>
                        <div
                          className={`text-base font-bold font-mono ${
                            sess.accuracy === null
                              ? "text-gray-400"
                              : sess.accuracy >= 70
                              ? "text-emerald-500"
                              : sess.accuracy >= 40
                              ? "text-amber-500"
                              : "text-rose-500"
                          }`}
                        >
                          {sess.accuracy !== null ? `${sess.accuracy}%` : "—"}
                        </div>
                      </div>

                      <button
                        onClick={() => filterBySession(sess.sessionId)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-all cursor-pointer whitespace-nowrap"
                      >
                        View Games ({sess.games.length})
                      </button>
                    </div>
                  </div>

                  {/* Expanded Session Games List */}
                  {isExpanded && (
                    <div className="p-4 bg-gray-50/80 dark:bg-black/40 border-t border-gray-200 dark:border-white/10 space-y-3">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider mb-2">
                        Games in Session {sess.sessionId}
                      </div>

                      {sess.games.length === 0 ? (
                        <div className="text-xs text-gray-500 py-2 font-mono">
                          No games registered under this session yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {sess.games.map((g) => (
                            <div
                              key={g.gameId}
                              className="p-3 bg-white dark:bg-purple-950/20 border border-gray-200 dark:border-purple-900/30 rounded-xl space-y-1.5 text-xs font-mono"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900 dark:text-white uppercase">
                                  {g.gameType}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                                    g.result === "win"
                                      ? "bg-emerald-500/15 text-emerald-600"
                                      : g.result === "loss"
                                      ? "bg-rose-500/15 text-rose-600"
                                      : g.result === "draw"
                                      ? "bg-amber-500/15 text-amber-600"
                                      : "bg-purple-500/15 text-purple-400"
                                  }`}
                                >
                                  {g.result}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-500">ID: {g.gameId}</div>
                              <div className="flex items-center justify-between text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-100 dark:border-white/5">
                                <span>{g.totalCalls} calls</span>
                                <span className="text-emerald-500 font-bold">
                                  {g.accuracy !== null ? `${g.accuracy}% acc` : "—"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: GAME HISTORY */}
      {activeTab === "games" && (
        <div className="w-full max-w-7xl space-y-4">
          {games.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 text-gray-500">
              <Gamepad2 className="w-10 h-10 mx-auto mb-3 text-pink-400/50" />
              <p className="text-sm font-semibold">No games found.</p>
              <p className="text-xs text-gray-400 mt-1">
                {selectedSessionForFilter
                  ? `No games found under session ${selectedSessionForFilter}.`
                  : "Start a match in Tic-Tac-Toe or generate a Sudoku puzzle to see game records."}
              </p>
            </div>
          ) : (
            games.map((game) => {
              const isExpanded = !!expandedGameIds[game.gameId];

              return (
                <div
                  key={game.gameId}
                  className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Game Summary Header */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleGameExpand(game.gameId)}
                        className="p-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                            Game: {game.gameId}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400 text-[10px] font-mono font-semibold border border-pink-500/20 uppercase">
                            {game.gameType}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                              game.result === "win"
                                ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                                : game.result === "loss"
                                ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                                : game.result === "draw"
                                ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                                : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                            }`}
                          >
                            {game.result}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-1 font-mono">
                          <span>Session: {game.sessionId}</span>
                          <span>•</span>
                          <span>Started: {game.startedAt}</span>
                          <span>•</span>
                          <span>{game.totalCalls} decision call{game.totalCalls === 1 ? "" : "s"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-4">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-mono">Accuracy</div>
                        <div
                          className={`text-base font-bold font-mono ${
                            game.accuracy === null
                              ? "text-gray-400"
                              : game.accuracy >= 70
                              ? "text-emerald-500"
                              : game.accuracy >= 40
                              ? "text-amber-500"
                              : "text-rose-500"
                          }`}
                        >
                          {game.accuracy !== null ? `${game.accuracy}%` : "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Decision Sequence (Trace Style) */}
                  {isExpanded && (
                    <div className="p-4 bg-gray-900 text-gray-100 dark:bg-black/60 border-t border-gray-200 dark:border-white/10 font-mono space-y-3">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-800 text-gray-400">
                        <span className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-pink-400" />
                          Sequential Decision History for Game {game.gameId}
                        </span>
                        <span>{game.calls?.length || 0} Total Steps</span>
                      </div>

                      {(!game.calls || game.calls.length === 0) ? (
                        <div className="text-xs text-gray-500 py-3">
                          No individual Jev call telemetry found for this game.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                          {game.calls.map((call) => (
                            <div
                              key={call.id}
                              className="p-3 bg-gray-950/80 rounded-xl border border-gray-800/80 text-xs space-y-2 hover:border-purple-500/40 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                                    Step #{call.stepNumber}
                                  </span>
                                  <span className="text-gray-300 font-semibold">
                                    {call.questionId}
                                  </span>
                                </div>

                                <div>
                                  {call.isCorrect === true && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      OPTIMAL / CORRECT
                                    </span>
                                  )}
                                  {call.isCorrect === false && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/50 border border-rose-500/30 px-2 py-0.5 rounded-full">
                                      <XCircle className="w-3.5 h-3.5" />
                                      SUBOPTIMAL / INCORRECT
                                    </span>
                                  )}
                                  {call.isCorrect === null && (
                                    <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                                      EVALUATED
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 bg-black/50 p-2 rounded-lg border border-gray-800 text-[11px]">
                                <div>
                                  <span className="text-gray-500 block text-[10px]">CHOICE</span>
                                  <span className="font-bold text-white text-sm">{call.choice}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">CONFIDENCE</span>
                                  <span className="font-bold text-purple-400 text-sm">
                                    {(call.confidence * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">LATENCY</span>
                                  <span className="font-bold text-cyan-400 text-sm">{call.latencyMs}ms</span>
                                </div>
                              </div>

                              {call.instructions && (
                                <div className="text-[11px] text-gray-400">
                                  <span className="text-purple-400 font-bold">Instructions: </span>
                                  <span>{call.instructions}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 3: RAW TELEMETRY CALLS */}
      {activeTab === "calls" && (
        <div className="w-full max-w-7xl space-y-6">
          {/* Filter Bar */}
          <div className="p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search state, question, session, choice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                />
              </div>

              {/* Game Filter */}
              <select
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="all">All Games</option>
                <option value="sudoku">Sudoku</option>
                <option value="tictactoe">Tic-Tac-Toe</option>
              </select>

              {/* Mode Filter */}
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="all">All Modes</option>
                <option value="manual">Manual</option>
                <option value="autocomplete">Autocomplete</option>
              </select>

              {/* Correctness Filter */}
              <select
                value={correctnessFilter}
                onChange={(e) => setCorrectnessFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="all">All Results</option>
                <option value="correct">Optimal / Correct</option>
                <option value="incorrect">Suboptimal / Incorrect</option>
              </select>
            </div>

            <div className="text-xs text-gray-500 font-mono">
              Total Records: <strong className="text-gray-900 dark:text-white">{pagination.totalCount}</strong>
            </div>
          </div>

          {/* Paginated Table */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-white/10">
                  <tr>
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Session</th>
                    <th className="py-3 px-3">Game</th>
                    <th className="py-3 px-3">Choice</th>
                    <th className="py-3 px-3">Confidence</th>
                    <th className="py-3 px-3">Latency</th>
                    <th className="py-3 px-3">Verdict</th>
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500">
                        No telemetry rows match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">#{row.id}</td>
                        <td className="py-3 px-3 text-purple-600 dark:text-purple-400 font-mono">
                          {row.sessionId ? `${row.sessionId.slice(0, 6)}...` : "—"}
                        </td>
                        <td className="py-3 px-3 font-semibold uppercase">{row.game}</td>
                        <td className="py-3 px-3 font-bold text-pink-600 dark:text-pink-400">{row.choice}</td>
                        <td className="py-3 px-3 text-purple-500 font-semibold">
                          {(row.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-cyan-600 dark:text-cyan-400">{row.latencyMs} ms</td>
                        <td className="py-3 px-3">
                          {row.isCorrect === true && (
                            <span className="text-emerald-500 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              PASS
                            </span>
                          )}
                          {row.isCorrect === false && (
                            <span className="text-rose-500 font-bold flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              FAIL
                            </span>
                          )}
                          {row.isCorrect === null && (
                            <span className="text-gray-400">UNVERIFIED</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-gray-500 text-[11px]">{row.createdAt}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedDetailsRow(row)}
                            className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-colors cursor-pointer"
                            title="Inspect full payload"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-xs font-mono">
              <div className="text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(pagination.totalPages, prev.page + 1),
                    }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: PIVOT MATRIX */}
      {activeTab === "pivot" && (
        <div className="w-full max-w-7xl">
          <div className="p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl backdrop-blur-md">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Grid className="w-4 h-4 text-purple-500" />
              Cross-Tabulated Confidence vs. Game Accuracy
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Shows query count and empirical accuracy percentage per confidence tier for each game.
            </p>

            {pivot ? (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono">
                  <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-500 uppercase">
                    <tr>
                      <th className="py-3 px-4 text-left">Game</th>
                      {pivot.bins.map((bin) => (
                        <th key={bin} className="py-3 px-3">{bin}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {pivot.games.map((g) => (
                      <tr key={g} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                        <td className="py-3.5 px-4 text-left font-bold capitalize text-gray-900 dark:text-white">
                          {g}
                        </td>
                        {pivot.bins.map((bin) => {
                          const cell = pivot.data[g]?.[bin];
                          if (!cell || cell.count === 0) {
                            return (
                              <td key={bin} className="py-3.5 px-3 text-gray-400">
                                —
                              </td>
                            );
                          }
                          return (
                            <td key={bin} className="py-3.5 px-3">
                              <div className="font-bold text-purple-600 dark:text-purple-400">
                                {cell.accuracy !== null ? `${cell.accuracy}%` : "—"}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                n={cell.count}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500 text-xs">
                No pivot matrix data available.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Inspection Modal */}
      {selectedDetailsRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 text-gray-100 border border-purple-500/40 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden font-mono text-xs">
            <div className="p-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  Call #{selectedDetailsRow.id}
                </span>
                <span className="font-bold text-white uppercase">{selectedDetailsRow.game}</span>
                {selectedDetailsRow.sessionId && (
                  <span className="text-gray-400 text-[11px]">
                    (Sess: {selectedDetailsRow.sessionId})
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedDetailsRow(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <div className="text-[10px] text-purple-400 font-bold uppercase mb-1">
                  Instructions Sent to Jev:
                </div>
                <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {selectedDetailsRow.instructions}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1">
                  State String Sent:
                </div>
                <pre className="p-3 bg-gray-950 rounded-xl border border-gray-800 text-emerald-300 overflow-x-auto leading-relaxed">
                  {selectedDetailsRow.state}
                </pre>
              </div>

              {selectedDetailsRow.criteria && (
                <div>
                  <div className="text-[10px] text-cyan-400 font-bold uppercase mb-1">
                    Criteria Formatted:
                  </div>
                  <pre className="p-3 bg-gray-950 rounded-xl border border-gray-800 text-cyan-300 overflow-x-auto leading-relaxed">
                    {JSON.stringify(selectedDetailsRow.criteria, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
