import Link from "next/link";
import {
  Cpu,
  Brain,
  Zap,
  Target,
  ShieldCheck,
  KeyRound,
  Database,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Sparkles,
  Grid3X3,
  Gamepad2,
  Lock,
} from "lucide-react";

export const metadata = {
  title: "About System One Architecture & Benchmark Methodology | Jev Arcade",
  description:
    "Comprehensive technical documentation on TypeSafe System One (jev-latest) architecture, benchmark design, calibration mathematics, and security model.",
};

export default function AboutPage() {
  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-10 space-y-12 transition-colors">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 text-xs font-mono tracking-wide uppercase font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Technical Specification & Methodology
        </div>
        <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-400 dark:via-pink-400 dark:to-indigo-300 bg-clip-text text-transparent tracking-tight">
          System One Evaluation Harness
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
          An in-depth guide to the architecture of TypeSafe’s System One model (<code>jev-latest</code>),
          the deterministic benchmark games, Expected Calibration Error (ECE) telemetry, and the zero-retention security model.
        </p>
      </section>

      {/* Quick Nav TOC */}
      <div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300">
        <div className="font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 text-[11px]">
          Table of Contents
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono">
          <a href="#system-one-arch" className="hover:text-pink-600 dark:hover:text-pink-400">1. System One Architecture</a>
          <a href="#benchmark-purpose" className="hover:text-pink-600 dark:hover:text-pink-400">2. Benchmark Purpose & Design</a>
          <a href="#sudoku-oracle" className="hover:text-pink-600 dark:hover:text-pink-400">3. Sudoku Oracle Mechanics</a>
          <a href="#tictactoe-arena" className="hover:text-pink-600 dark:hover:text-pink-400">4. Tic-Tac-Toe & Minimax Baseline</a>
          <a href="#telemetry-metrics" className="hover:text-pink-600 dark:hover:text-pink-400">5. Telemetry & Metrics</a>
          <a href="#ece-calibration" className="hover:text-pink-600 dark:hover:text-pink-400">6. Calibration & ECE Formula</a>
          <a href="#storage-infra" className="hover:text-pink-600 dark:hover:text-pink-400">7. Neon Serverless & Storage</a>
          <a href="#byok-security" className="hover:text-pink-600 dark:hover:text-pink-400">8. BYOK & Security Architecture</a>
          <a href="#abuse-mitigation" className="hover:text-pink-600 dark:hover:text-pink-400">9. Abuse Mitigation & Trial Caps</a>
          <a href="#limitations" className="hover:text-pink-600 dark:hover:text-pink-400">10. Limitations & Roadmap</a>
        </div>
      </div>

      {/* 1. System One Architecture */}
      <section id="system-one-arch" className="p-8 rounded-3xl bg-white dark:bg-[#15101a] border border-gray-200 dark:border-white/10 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. System One AI Model Architecture</h2>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-mono">Neural Reflex vs Multi-Turn Chain-of-Thought</p>
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
          <p>
            Drawing from cognitive psychology (Daniel Kahneman&apos;s <em>Thinking, Fast and Slow</em>), <strong>System One</strong> AI models are optimized for <strong>sub-second neural reflex decisions</strong> rather than long, autoregressive chain-of-thought (System Two) generation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-purple-500/5 dark:bg-purple-950/30 border border-purple-500/20 space-y-2">
              <div className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> System One (jev-latest)
              </div>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• <strong>Latency:</strong> 150ms – 450ms single-pass</li>
                <li>• <strong>Output:</strong> Structured choice + calibrated logit confidence</li>
                <li>• <strong>Cost:</strong> Extreme token and compute efficiency</li>
                <li>• <strong>Application:</strong> Real-time routing, gaming, triage, fast classification</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
              <div className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Brain className="w-4 h-4" /> System Two (CoT LLMs)
              </div>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• <strong>Latency:</strong> 2,000ms – 15,000ms+ multi-token stream</li>
                <li>• <strong>Output:</strong> Long markdown stream of deliberation</li>
                <li>• <strong>Cost:</strong> High token consumption and compute cost</li>
                <li>• <strong>Application:</strong> Complex code synthesis, theorem proving</li>
              </ul>
            </div>
          </div>
          <p>
            TypeSafe&apos;s <code>jev-latest</code> exposes an explicit decision API where options and criteria are evaluated simultaneously, returning both the discrete choice and full softmax probability distributions over all candidate actions.
          </p>
        </div>
      </section>

      {/* 2. Benchmark Philosophy & Purpose */}
      <section id="benchmark-purpose" className="p-8 rounded-3xl bg-white dark:bg-[#15101a] border border-gray-200 dark:border-white/10 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. Benchmark Purpose & Ground-Truth Rigor</h2>
            <p className="text-xs text-pink-600 dark:text-pink-400 font-mono">Deterministic Sandboxes for Decision Intelligence</p>
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
          <p>
            Most modern LLM benchmarks (e.g., MMLU, Chatbot Arena) suffer from subjectivity, prompt sensitivity, and lack of mathematical ground truth. Jev Arcade solves this by utilizing <strong>deterministic game environments</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-300">
            <li><strong>Zero Hallucination Tolerance:</strong> In Sudoku, a number is either valid and unique according to the exact puzzle solution, or it is mathematically wrong.</li>
            <li><strong>Minimax Game-Theoretic Optimality:</strong> In Tic-Tac-Toe, every board state has an exact, provable optimal value (Win, Draw, or Loss) computed via exhaustive game-tree search.</li>
            <li><strong>Empirical Calibration:</strong> When Jev claims 95% confidence, does it achieve 95% empirical accuracy across thousands of decisions?</li>
          </ul>
        </div>
      </section>

      {/* 3. Sudoku Oracle Mechanics */}
      <section id="sudoku-oracle" className="p-8 rounded-3xl bg-white dark:bg-[#15101a] border border-gray-200 dark:border-white/10 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Grid3X3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Sudoku Oracle Mechanics</h2>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-mono">Single-Cell Prompting & Error Compounding Cascades</p>
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
          <p>
            In the Sudoku Oracle, each call to Jev evaluates a single target cell <code>(row, col)</code> on a 9x9 grid. The API constructs a rich prompt with:
          </p>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 font-mono text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div><strong>Context:</strong> ASCII representation of the active board + Givens mask</div>
            <div><strong>Options:</strong> Digits <code>[&quot;1&quot;, &quot;2&quot;, &quot;3&quot;, &quot;4&quot;, &quot;5&quot;, &quot;6&quot;, &quot;7&quot;, &quot;8&quot;, &quot;9&quot;]</code></div>
            <div><strong>Criteria:</strong> Dynamic candidate hints (digits already present in Row X, Column Y, and 3x3 Box Z)</div>
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white pt-2">Sequential Error Compounding Analysis</h4>
          <p>
            During full <strong>Autocomplete</strong>, Jev solves cells sequentially. When Jev makes an error on Step <em>k</em>, that erroneous digit is placed onto the live working board and fed as factual context into Step <em>k+1</em>. This allows the telemetry engine to measure <strong>error cascade resilience</strong>—evaluating how quickly single mistakes propagate into global grid violations.
          </p>
        </div>
      </section>

      {/* 4. Tic-Tac-Toe Arena Mechanics */}
      <section id="tictactoe-arena" className="p-8 rounded-3xl bg-white dark:bg-[#15101a] border border-gray-200 dark:border-white/10 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Tic-Tac-Toe Arena & Minimax Baseline</h2>
            <p className="text-xs text-pink-600 dark:text-pink-400 font-mono">Discrete Heuristic Criteria & Perfect Game Play</p>
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
          <p>
            For each Tic-Tac-Toe turn, the server computes deterministic tactical descriptions for every open cell before invoking Jev:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-xs text-gray-600 dark:text-gray-400">
            <li><code>Completes three in a row — WINNING MOVE</code></li>
            <li><code>Blocks opponent&apos;s winning line</code></li>
            <li><code>Center position</code> / <code>Corner position</code> / <code>Edge position</code></li>
          </ul>
          <p>
            Simultaneously, the backend executes an exhaustive <strong>Minimax solver</strong> over all possible remaining game trees. Every move chosen by Jev is mathematically graded as:
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
              ✓ Optimal Move (Preserves Maximum Game Value)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold">
              ✗ Sub-Optimal / Blunder (Sacrifices Game Value)
            </span>
          </div>
        </div>
      </section>

      {/* 5. Telemetry & Metrics */}
      <section id="telemetry-metrics" className="p-8 rounded-3xl bg-white dark:bg-[#15101a] border border-gray-200 dark:border-white/10 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Telemetry & Metrics Explained</h2>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">Latency Percentiles, Accuracy, and Session Isolation</p>
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
          <p>
            The <strong>/stats</strong> telemetry dashboard computes empirical performance statistics over all historical model invocations:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5">
              <div className="font-bold text-gray-900 dark:text-white">p50 / p95 / p99 Latency</div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Tracks tail latency distribution in milliseconds from HTTP dispatch to decision return.</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5">
              <div className="font-bold text-gray-900 dark:text-white">Ground-Truth Accuracy</div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Percentage of Sudoku cells correctly matching exact puzzle solutions.</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5">
              <div className="font-bold text-gray-900 dark:text-white">Minimax Optimality %</div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Fraction of Tic-Tac-Toe turns matching game-theoretically proven best moves.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Calibration & ECE Formula */}
      <section id="ece-calibration" className="p-8 rounded-3xl bg-white dark:bg-[#15101a] border border-gray-200 dark:border-white/10 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. Expected Calibration Error (ECE) Formula</h2>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-mono">Mathematical Measure of Model Self-Awareness</p>
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
          <p>
            A well-calibrated classifier produces confidence estimates that match true empirical accuracy. If a model predicts 100 choices with 80% confidence, exactly 80 of those predictions should be correct.
          </p>
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 font-mono text-center text-sm sm:text-base font-bold text-purple-900 dark:text-purple-200">
            ECE = ∑ ( |B_m| / N ) · | acc(B_m) - conf(B_m) |
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Where <code>M</code> represents the number of confidence bins (e.g., 10 bins: 0–10%, 10–20%, ..., 90–100%), <code>|B_m|</code> is the count of samples falling in bin <code>m</code>, <code>N</code> is total calls, <code>acc(B_m)</code> is empirical accuracy within bin <code>m</code>, and <code>conf(B_m)</code> is average predicted confidence in bin <code>m</code>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
              <strong>Overconfidence (acc &lt; conf):</strong> Model assigns high certainty to flawed moves—a primary failure mode in uncalibrated neural nets.
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300">
              <strong>Underconfidence (acc &gt; conf):</strong> Model achieves correct results while understating its certainty.
            </div>
          </div>
        </div>
      </section>

      {/* 7. Neon Serverless & Storage */}
      <section id="storage-infra" className="p-8 rounded-3xl bg-white dark:bg-[#15101a] border border-gray-200 dark:border-white/10 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">7. Neon Serverless Postgres Architecture</h2>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">Dual-Driver Resilience with Connection Pooling</p>
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
          <p>
            Jev Arcade uses <strong><code>@neondatabase/serverless</code></strong> as its primary production database driver on Vercel:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-300">
            <li><strong>Pooled Connection String:</strong> Configured using Neon pooled endpoints (ending in <code>-pooler...</code>) to prevent connection starvation across serverless edge lambdas.</li>
            <li><strong>Dual Driver Architecture:</strong> When deployed locally without Postgres environment variables, the system seamlessly uses <code>better-sqlite3</code> (stored at <code>data/jev-arcade.db</code>), ensuring identical schema execution offline.</li>
            <li><strong>Relational Schema:</strong> Indexes on <code>sessions</code>, <code>games</code>, <code>moves</code>, and <code>trial_claims</code> for instant aggregation queries.</li>
          </ul>
        </div>
      </section>

      {/* 8. BYOK & Security Architecture */}
      <section id="byok-security" className="p-8 rounded-3xl bg-white dark:bg-[#15101a] border border-gray-200 dark:border-white/10 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">8. BYOK (Bring Your Own Key) Security</h2>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-mono">AES-256-GCM Encryption with Zero Retention</p>
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
          <p>
            When you provide a TypeSafe API key for unthrottled benchmarking, the application guarantees enterprise-grade security:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 space-y-1">
              <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500" /> AES-256-GCM Session Cookie
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                The key is encrypted using authenticated AES-256-GCM with unique initialization vectors (IV) and stored exclusively in an <code>httpOnly</code>, <code>SameSite=Strict</code> cookie.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 space-y-1">
              <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Zero Database Retention
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                API keys are <strong>NEVER</strong> written to the Postgres database, SQLite file, or printed to server console logs.
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Before setting the session cookie, the server performs a live test request against TypeSafe&apos;s API endpoint to verify key validity and avoid runtime disruption.
          </p>
        </div>
      </section>

      {/* 9. Abuse Mitigation & Trial Caps */}
      <section id="abuse-mitigation" className="p-8 rounded-3xl bg-white dark:bg-[#15101a] border border-gray-200 dark:border-white/10 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">9. Abuse Mitigation & Free Trial Caps</h2>
            <p className="text-xs text-pink-600 dark:text-pink-400 font-mono">10-Call Quota with Multi-Layer Protection</p>
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
          <p>
            To prevent serverless cost exploitation while providing instant evaluations for new visitors, the free sandbox implements a strict <strong>10-call total limit</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-300">
            <li><strong>Strict Server-Side Counter:</strong> Each Sudoku cell or Tic-Tac-Toe move atomically increments <code>free_calls_used</code> in the database. When it reaches 10, subsequent calls return HTTP 403 <code>FREE_LIMIT_REACHED</code>.</li>
            <li><strong>Persistent 1-Year Trial Cookie:</strong> A long-lived <code>jev_trial_claimed</code> cookie prevents resetting trial counters by refreshing or starting new sessions.</li>
            <li><strong>Server-Side Fingerprinting:</strong> A SHA-256 hash of IP subnet, User-Agent, and Accept-Language headers links trial claims to prevent cookie clearance evasion.</li>
          </ul>
        </div>
      </section>

      {/* 10. Limitations & Roadmap */}
      <section id="limitations" className="p-8 rounded-3xl bg-white dark:bg-[#15101a] border border-gray-200 dark:border-white/10 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">10. Limitations & Future Roadmap</h2>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">Known Failure Modes & Next Benchmark Horizons</p>
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
          <p>
            While System One models excel at sub-200ms reflex decisions, certain structural limitations exist:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-300">
            <li><strong>Combinatorial Backtracking Depth:</strong> Highly difficult Sudoku puzzles requiring multiple nested hypotheses (e.g., Swordfish, XY-Wing) can challenge single-pass neural boundaries without explicit search.</li>
            <li><strong>Upcoming Game Modules:</strong> We are preparing benchmarks for <em>Connect Four</em>, <em>Chess Endgame Tactics</em>, and <em>Logic Grid Deduction</em> to evaluate System One across higher-order discrete decision spaces.</li>
          </ul>
          <div className="pt-4 flex flex-wrap gap-3">
            <Link
              href="/sudoku"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <Grid3X3 className="w-4 h-4" />
              Try Sudoku Oracle
            </Link>
            <Link
              href="/tictactoe"
              className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <Gamepad2 className="w-4 h-4" />
              Try Tic-Tac-Toe Arena
            </Link>
            <Link
              href="/stats"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              View Telemetry Analytics
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
