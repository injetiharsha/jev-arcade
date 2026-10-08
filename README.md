# Jev Arcade (TypeSafe System One Benchmark)

An empirical benchmark suite evaluating TypeSafe's non-autoregressive System One reasoning model (`jev-latest`) across deterministic constraint games (Sudoku) and strategic game-theoretic environments (Tic-Tac-Toe).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or Node.js 20+
- A TypeSafe API Key (or use BYOK mode in app)

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Create `.env.local` (or configure in Vercel Project Settings):

```env
# TypeSafe Jev API Key
TYPESAFE_API_KEY="your-typesafe-api-key"
JEV_API_KEY="your-typesafe-api-key"

# Database Connection (Neon / Vercel Postgres)
# Use the pooled connection string ending with -pooler for serverless environments
DATABASE_URL="postgres://user:password@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

> **Note on Local Development**: If `DATABASE_URL` is omitted, the app automatically uses a local SQLite fallback (`data/jev-arcade.db`) for offline development.

---

## 🗄️ Database Architecture & Migrations

The application uses `@neondatabase/serverless` with connection pooling for zero-latency, serverless-compatible persistence on Vercel.

### Schema Overview:
- `sessions`: Tracks session reference IDs (`DDMMYY` + `HHMMSS` + `A`/`P`), creation, termination, and mode.
- `games`: Tracks game lifecycle records, start/end timestamps, and terminal results (`win`, `loss`, `draw`, `completed`, `abandoned`).
- `jev_calls`: Detailed telemetry per decision query (latency, confidence, choice, correctness, prompt state, instructions, criteria JSON).

### Running Postgres Migrations:
When deploying to a new Neon / Vercel Postgres database instance:
```bash
npx tsx scripts/migrate-postgres.ts
```

---

## 🎮 Benchmark Modules

1. **Sudoku Constraint Engine (`/sudoku`)**:
   - Single-shot constraint reasoning with explicit hint vectors.
   - Pre-validated verified puzzle bank with instant in-memory cache.
   - Live Jev Reasoning Trace and full grid validity violation auditor.

2. **Tic-Tac-Toe Strategy Engine (`/tictactoe`)**:
   - Multi-step tactical and defensive play against minimax optimal solver.
   - Deterministic candidate criteria heuristics (winning move, blocking, center/corner priority).

3. **Telemetry & Calibration Dashboard (`/stats`)**:
   - ECE (Expected Calibration Error) probability calibration curves ($y = x$ reference).
   - Latency Over Time scatter chart with game filters, clickable inspection popovers, and interactive legend series toggles.
   - Tail latency (P50/P95) and confidence distribution histograms.

4. **Data Explorer (`/data`)**:
   - Session History, Game History, Raw Calls inspector, and Pivot Matrix.
