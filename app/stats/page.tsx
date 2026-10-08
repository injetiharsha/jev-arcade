"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  Gauge,
  CheckCircle2,
  Clock,
  RotateCcw,
  Zap,
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  Scale,
  Filter,
  X,
  Copy,
  Check,
  ChevronRight,
  Info,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { GAME_COLORS, getGameColor, getGameDisplayName } from "@/lib/gameColors";

interface LatencyPoint {
  id: number;
  sessionId: string | null;
  gameId: string | null;
  game: string;
  latencyMs: number;
  confidence: number;
  choice: string;
  isCorrect: boolean | null;
  questionId: string;
  createdAt: string;
  instructions: string;
  state: string;
  criteria: any;
  index?: number;
  time?: string;
}

interface StatsData {
  overall: {
    totalCalls: number;
    overallAccuracy: number;
    avgConfidence: number;
    avgLatencyMs: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
  };
  byGame: Record<
    string,
    {
      totalCalls: number;
      accuracy: number;
      avgConfidence: number;
      avgLatencyMs: number;
    }
  >;
  accuracyByGame: Array<{
    game: string;
    totalCalls: number;
    accuracy: number;
    avgConfidence: number;
    avgLatencyMs: number;
  }>;
  calibration: {
    bins: Array<{
      range: string;
      count: number;
      avgConfidence: number;
      actualAccuracy: number;
    }>;
    expectedCalibrationError: number;
  };
  latencyOverTime: LatencyPoint[];
  latencyDistribution: Array<{
    range: string;
    count: number;
  }>;
  confidenceHistogram: Array<{
    range: string;
    count: number;
  }>;
  sudokuDifficultyAccuracy: Array<{
    difficulty: string;
    total: number;
    accuracy: number;
  }>;
}

export default function StatsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: StatsData = await res.json();
      setStats(data);
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load telemetry stats");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Dynamic Theme Colors for Charts
  const gridStroke = isDark ? "#ffffff12" : "#e2e8f0";
  const axisTickColor = isDark ? "#9ca3af" : "#64748b";
  const tooltipBg = isDark ? "#120e17" : "#ffffff";
  const tooltipBorder = isDark ? "#3b1e54" : "#e2e8f0";
  const tooltipText = isDark ? "#ffffff" : "#0f172a";

  const [selectedGames, setSelectedGames] = useState<string[]>(["sudoku", "tictactoe"]);
  const [selectedPoint, setSelectedPoint] = useState<LatencyPoint | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Calibration Points
  const calibrationPoints = stats
    ? stats.calibration.bins.map((b) => ({
        ...b,
        x: Math.round(b.avgConfidence * 100),
        y: Math.round(b.actualAccuracy * 100),
      }))
    : [];

  // Available games present in the telemetry
  const availableGames = Array.from(
    new Set([
      "sudoku",
      "tictactoe",
      ...(stats?.latencyOverTime.map((p) => p.game) || []),
      ...(stats?.accuracyByGame.map((g) => g.game) || []),
    ])
  );

  const toggleGameFilter = (gameKey: string) => {
    setSelectedGames((prev) =>
      prev.includes(gameKey)
        ? prev.filter((g) => g !== gameKey)
        : [...prev, gameKey]
    );
  };

  const selectAllGames = () => {
    setSelectedGames(availableGames);
  };

  // Latency data with index and timestamp
  const indexedLatencyData: LatencyPoint[] = (stats?.latencyOverTime || []).map(
    (item, idx) => ({
      ...item,
      index: idx + 1,
      time: item.createdAt.split(" ")[1] || item.createdAt,
    })
  );

  // Filtered latency data grouped by game for Recharts series
  const pointsByGame = availableGames.reduce<Record<string, LatencyPoint[]>>(
    (acc, game) => {
      acc[game] = indexedLatencyData.filter((p) => p.game === game);
      return acc;
    },
    {}
  );

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs px-2.5 py-1 rounded-md bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
            >
              ← Arcade Home
            </Link>
            <span className="text-xs text-pink-600 dark:text-pink-400 font-mono tracking-wide uppercase bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
              Telemetry Dashboard
            </span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mt-1">
            System One Benchmark &amp; Calibration
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Empirical telemetry evaluating accuracy, probability calibration, and latency dynamics across all interactive sessions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={async () => {
              if (window.confirm("Are you sure you want to wipe all session and telemetry history? This cannot be undone.")) {
                try {
                  const res = await fetch("/api/data", { method: "DELETE" });
                  if (res.ok) {
                    alert("Telemetry database successfully wiped to a clean slate.");
                    fetchStats();
                  }
                } catch (e) {
                  alert("Failed to wipe database");
                }
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
            title="Reset telemetry database to a completely blank slate"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>Wipe History</span>
          </button>
          <button
            onClick={fetchStats}
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
          <button onClick={fetchStats} className="text-xs underline hover:opacity-80">
            Retry
          </button>
        </div>
      )}

      {/* 1. Top Summary KPI Cards */}
      <div className="w-full max-w-7xl grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Calls</span>
            <Zap className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-gray-900 dark:text-white">
            {stats?.overall.totalCalls.toLocaleString() ?? "—"}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Logged across all games
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Overall Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {stats ? `${(stats.overall.overallAccuracy * 100).toFixed(1)}%` : "—"}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Evaluated predictions
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Confidence</span>
            <Gauge className="w-4 h-4 text-pink-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-pink-600 dark:text-pink-400">
            {stats ? `${(stats.overall.avgConfidence * 100).toFixed(1)}%` : "—"}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Average model certainty
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Latency</span>
            <Clock className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
            {stats ? `${stats.overall.avgLatencyMs.toFixed(0)} ms` : "—"}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            P50: {stats?.overall.p50LatencyMs.toFixed(0) ?? "—"} ms
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm backdrop-blur-md col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">P95 Latency</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {stats ? `${stats.overall.p95LatencyMs.toFixed(0)} ms` : "—"}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Tail latency ceiling
          </div>
        </div>
      </div>

      {/* SECTION 1: LATENCY */}
      <section className="w-full max-w-7xl mb-10">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-white/10">
          <Clock className="w-5 h-5 text-cyan-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Latency Performance</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1A: Latency Over Time */}
          <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-500" />
                  Latency Over Time (Last 200 Calls)
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Tracks decision latency across recent queries. Click points to inspect full call trace; toggle games via filters or legend.
              </p>

              {/* Game Multi-select Filter Bar */}
              <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-white/5">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3" /> Filter:
                </span>
                {availableGames.map((gameKey) => {
                  const isSelected = selectedGames.includes(gameKey);
                  const color = getGameColor(gameKey);
                  return (
                    <button
                      key={gameKey}
                      onClick={() => toggleGameFilter(gameKey)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white border-gray-300 dark:border-white/20 shadow-sm"
                          : "opacity-40 hover:opacity-75 bg-transparent border-transparent text-gray-500 line-through"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span>{getGameDisplayName(gameKey)}</span>
                    </button>
                  );
                })}
                {selectedGames.length < availableGames.length && (
                  <button
                    onClick={selectAllGames}
                    className="text-[11px] text-pink-500 hover:text-pink-400 underline ml-auto cursor-pointer"
                  >
                    Show All
                  </button>
                )}
              </div>
            </div>

            <div className="h-[280px] w-full">
              {indexedLatencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis
                      dataKey="index"
                      type="number"
                      name="Call #"
                      stroke={axisTickColor}
                      tick={{ fontSize: 11 }}
                      domain={["dataMin", "dataMax"]}
                    />
                    <YAxis
                      dataKey="latencyMs"
                      type="number"
                      name="Latency"
                      stroke={axisTickColor}
                      tick={{ fontSize: 11 }}
                      unit="ms"
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as LatencyPoint;
                          return (
                            <div className="p-3 rounded-xl bg-white dark:bg-[#15101a] border border-gray-200 dark:border-white/10 shadow-xl text-xs space-y-1 z-50">
                              <div className="flex items-center gap-2 font-bold">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: getGameColor(data.game) }}
                                />
                                <span>{getGameDisplayName(data.game)}</span>
                                <span className="text-gray-400 font-mono">#{data.index}</span>
                              </div>
                              <div className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                                {data.latencyMs} ms
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">
                                Conf: {(data.confidence * 100).toFixed(1)}% | Choice:{" "}
                                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                                  {data.choice}
                                </span>
                              </div>
                              <div className="text-[10px] text-pink-500 font-semibold mt-1">
                                Click point to inspect full call trace
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      onClick={(e: any) => {
                        const clickedName = e.dataKey || e.value;
                        const matchedGame = availableGames.find(
                          (g) => getGameDisplayName(g) === clickedName || g === clickedName
                        );
                        if (matchedGame) toggleGameFilter(matchedGame);
                      }}
                      wrapperStyle={{ cursor: "pointer", paddingTop: "8px", fontSize: "11px" }}
                    />
                    {availableGames.map((gameKey) => {
                      if (!selectedGames.includes(gameKey)) return null;
                      const gameData = pointsByGame[gameKey] || [];
                      if (gameData.length === 0) return null;
                      return (
                        <Scatter
                          key={gameKey}
                          name={getGameDisplayName(gameKey)}
                          data={gameData}
                          fill={getGameColor(gameKey)}
                          shape="circle"
                          cursor="pointer"
                          onClick={(pt: any) => setSelectedPoint(pt)}
                        />
                      );
                    })}
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  No telemetry records yet.
                </div>
              )}
            </div>
          </div>

          {/* Card 1B: Latency Distribution */}
          <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-500" />
                  Latency Distribution
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Categorizes all queries into response time tiers to inspect speed consistency and tail latencies.
              </p>
            </div>

            <div className="h-[280px] w-full">
              {stats?.latencyDistribution && stats.latencyDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.latencyDistribution} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="range" stroke={axisTickColor} tick={{ fontSize: 11 }} />
                    <YAxis stroke={axisTickColor} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: "12px",
                        color: tooltipText,
                        fontSize: "12px",
                      }}
                      formatter={(val: any) => [val, "Queries"]}
                    />
                    <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]}>
                      {stats.latencyDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index < 2 ? "#38bdf8" : index === 2 ? "#818cf8" : "#f43f5e"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  No distribution data available.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CONFIDENCE & CALIBRATION */}
      <section className="w-full max-w-7xl mb-10">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-white/10">
          <Scale className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Confidence & Calibration</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 2A: Confidence Distribution */}
          <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-purple-500" />
                  Confidence Distribution Histogram
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Measures how confident Jev is across all prompts regardless of outcome, answering &quot;How confident is Jev, generally?&quot;
              </p>
            </div>

            <div className="h-[280px] w-full">
              {stats?.confidenceHistogram && stats.confidenceHistogram.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.confidenceHistogram} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="range" stroke={axisTickColor} tick={{ fontSize: 10 }} />
                    <YAxis stroke={axisTickColor} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: "12px",
                        color: tooltipText,
                        fontSize: "12px",
                      }}
                      formatter={(val: any) => [val, "Queries"]}
                    />
                    <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  No confidence histogram data yet.
                </div>
              )}
            </div>
          </div>

          {/* Card 2B: Calibration Chart (Confidence vs Accuracy) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-pink-500" />
                  Probability Calibration Curve
                </h3>
                {stats?.calibration && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-semibold">
                    ECE: {(stats.calibration.expectedCalibrationError * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Compares stated confidence against actual empirical accuracy with a y = x reference line, answering &quot;Is that confidence justified?&quot;
              </p>
            </div>

            <div className="h-[280px] w-full">
              {calibrationPoints.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Avg Stated Confidence"
                      unit="%"
                      domain={[0, 100]}
                      stroke={axisTickColor}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Actual Accuracy"
                      unit="%"
                      domain={[0, 100]}
                      stroke={axisTickColor}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: "12px",
                        color: tooltipText,
                        fontSize: "12px",
                      }}
                      formatter={(val: any, name: any) => [`${val}%`, name]}
                    />
                    {/* Perfect Calibration Reference Line y = x */}
                    <ReferenceLine
                      segment={[
                        { x: 0, y: 0 },
                        { x: 100, y: 100 },
                      ]}
                      stroke={isDark ? "#ffffff40" : "#94a3b8"}
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: "Perfect (y = x)",
                        position: "insideTopLeft",
                        fill: isDark ? "#ffffff70" : "#64748b",
                        fontSize: 10,
                      }}
                    />
                    <Scatter name="Calibration Bins" data={calibrationPoints} fill="#ec4899" shape="circle" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  No evaluated calibration samples available.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: ACCURACY */}
      <section className="w-full max-w-7xl mb-10">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-white/10">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Accuracy Analysis</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 3A: Accuracy by Game */}
          <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  Accuracy by Game
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Evaluates overall task success rates across distinct reasoning domains and game dynamics.
              </p>
            </div>

            <div className="h-[280px] w-full">
              {stats?.accuracyByGame && stats.accuracyByGame.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.accuracyByGame} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="game" stroke={axisTickColor} tick={{ fontSize: 11 }} />
                    <YAxis stroke={axisTickColor} tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: "12px",
                        color: tooltipText,
                        fontSize: "12px",
                      }}
                      formatter={(val: any) => [`${val}%`, "Accuracy"]}
                    />
                    <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                      {stats.accuracyByGame.map((entry) => (
                        <Cell
                          key={`cell-${entry.game}`}
                          fill={getGameColor(entry.game)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  No accuracy records found.
                </div>
              )}
            </div>
          </div>

          {/* Card 3B: Sudoku Accuracy by Difficulty */}
          <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  Sudoku Accuracy by Difficulty
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Measures how benchmark accuracy scales as the number of missing cells and constraint density increases.
              </p>
            </div>

            <div className="h-[280px] w-full">
              {stats?.sudokuDifficultyAccuracy && stats.sudokuDifficultyAccuracy.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.sudokuDifficultyAccuracy} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="difficulty" stroke={axisTickColor} tick={{ fontSize: 11 }} />
                    <YAxis stroke={axisTickColor} tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: "12px",
                        color: tooltipText,
                        fontSize: "12px",
                      }}
                      formatter={(val: any) => [`${val}%`, "Accuracy"]}
                    />
                    <Bar dataKey="accuracy" fill={getGameColor("sudoku")} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  No difficulty breakdown records yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Per-Game Telemetry Breakdown Table */}
      <section className="w-full max-w-7xl mb-12">
        <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl backdrop-blur-md">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            Detailed Game Breakdown
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3 px-4">Game</th>
                  <th className="py-3 px-4">Total Calls</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Avg Confidence</th>
                  <th className="py-3 px-4">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-mono">
                {stats?.accuracyByGame && stats.accuracyByGame.length > 0 ? (
                  stats.accuracyByGame.map((row) => (
                    <tr key={row.game} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold capitalize text-gray-900 dark:text-white flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: getGameColor(row.game) }}
                        />
                        {getGameDisplayName(row.game)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                        {row.totalCalls.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            row.accuracy >= 70
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : row.accuracy >= 40
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {row.accuracy.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-pink-600 dark:text-pink-400 font-semibold">
                        {row.avgConfidence.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-cyan-600 dark:text-cyan-400 font-semibold">
                        {row.avgLatencyMs.toFixed(0)} ms
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No game calls recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Latency Point Detail Popover / Modal */}
      {selectedPoint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedPoint(null)}
        >
          <div
            className="bg-white dark:bg-[#130f18] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 text-gray-900 dark:text-gray-100 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: getGameColor(selectedPoint.game) }}
                />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {getGameDisplayName(selectedPoint.game)} Call Detail
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                  #{selectedPoint.index || selectedPoint.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                <div className="text-[10px] uppercase font-mono text-gray-400 mb-1">Latency</div>
                <div className="text-lg font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {selectedPoint.latencyMs} ms
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                <div className="text-[10px] uppercase font-mono text-gray-400 mb-1">Confidence</div>
                <div className="text-lg font-mono font-bold text-pink-600 dark:text-pink-400">
                  {(selectedPoint.confidence * 100).toFixed(1)}%
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                <div className="text-[10px] uppercase font-mono text-gray-400 mb-1">Jev Choice</div>
                <div className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400">
                  {selectedPoint.choice || "—"}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                <div className="text-[10px] uppercase font-mono text-gray-400 mb-1">Outcome</div>
                <div>
                  {selectedPoint.isCorrect === true ? (
                    <span className="text-xs px-2 py-0.5 rounded font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Correct
                    </span>
                  ) : selectedPoint.isCorrect === false ? (
                    <span className="text-xs px-2 py-0.5 rounded font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                      Incorrect
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded font-bold bg-gray-200 dark:bg-white/10 text-gray-500">
                      N/A
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* IDs Bar */}
            <div className="space-y-2 mb-5 text-xs font-mono">
              {selectedPoint.gameId && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                  <span className="text-gray-500 dark:text-gray-400">Game ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 dark:text-white font-bold">{selectedPoint.gameId}</span>
                    <button
                      onClick={() => copyToClipboard("gameId", selectedPoint.gameId!)}
                      className="p-1 hover:text-pink-500 transition-colors"
                      title="Copy Game ID"
                    >
                      {copiedKey === "gameId" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {selectedPoint.sessionId && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                  <span className="text-gray-500 dark:text-gray-400">Session ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 dark:text-white font-bold">{selectedPoint.sessionId}</span>
                    <button
                      onClick={() => copyToClipboard("sessionId", selectedPoint.sessionId!)}
                      className="p-1 hover:text-pink-500 transition-colors"
                      title="Copy Session ID"
                    >
                      {copiedKey === "sessionId" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                <span className="text-gray-500 dark:text-gray-400">Timestamp:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedPoint.createdAt}</span>
              </div>
            </div>

            {/* Prompt State & Instructions Trace */}
            <div className="space-y-3">
              {selectedPoint.instructions && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                    Instructions Sent to Jev
                  </div>
                  <pre className="p-3 rounded-xl bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/5 text-[11px] font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {selectedPoint.instructions}
                  </pre>
                </div>
              )}

              {selectedPoint.state && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                    Board / Grid State
                  </div>
                  <pre className="p-3 rounded-xl bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/5 text-[11px] font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {selectedPoint.state}
                  </pre>
                </div>
              )}

              {selectedPoint.criteria && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                    Candidate Criteria Options
                  </div>
                  <pre className="p-3 rounded-xl bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/5 text-[11px] font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {typeof selectedPoint.criteria === "object"
                      ? JSON.stringify(selectedPoint.criteria, null, 2)
                      : String(selectedPoint.criteria)}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedPoint(null)}
                className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white text-xs font-semibold hover:bg-gray-300 dark:hover:bg-white/20 transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
