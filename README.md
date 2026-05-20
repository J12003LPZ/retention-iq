# RetentionIQ

**Which customers are likely to churn, why, and how much revenue can we save?**

RetentionIQ is a full-stack SaaS churn analytics dashboard that combines a scikit-learn logistic regression model with a Next.js 16 App Router frontend to surface at-risk customers, quantify MRR exposure, and deliver prioritized retention recommendations — all in a dark-mode, production-grade UI.

---

## Screenshots

> Screenshots will be added once a public deployment is available. The dashboard includes an Overview page (KPI cards, trend chart, churn drivers), a Customer Health table with a slide-out detail drawer, a Cohort retention heatmap, Revenue Risk breakdown, Support Analytics, Churn Predictions, Recommendations, and a sandboxed SQL Explorer.

---

## Features

- **Overview** — KPI cards (churn rate, MRR at risk, at-risk count), HealthGauge, ChurnTrend area chart with granularity toggle, ChurnDrivers horizontal bar chart
- **Customer Health** — searchable, sortable, and filterable table; slide-out drawer showing ticket history, payment events, and churn probability
- **Cohort Analysis** — retention heatmap with hover tooltips showing cohort month vs. period-N retention
- **Revenue Risk** — MRR at risk broken down by plan tier; revenue flow table
- **Support Analytics** — ticket volume, CSAT, severity distribution
- **Churn Predictions** — feature importance chart, risk-segment donut, top-customers-to-save table with expected save value
- **Recommendations** — AI-ranked action cards with estimated MRR impact per customer
- **SQL Explorer** — sandboxed read-only query tool (forbidden keyword blocking, 500-row cap, 5-second timeout)
- **EDA Notebook** — Jupyter notebook documenting the churn model and exploratory analysis

---

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4?logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-canary-black)
![Neon](https://img.shields.io/badge/Neon-Postgres-00e5bf?logo=postgresql&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.11+-3776ab?logo=python&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-logistic_regression-f7931e?logo=scikitlearn&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-deployed-black?logo=vercel&logoColor=white)

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | Tailwind CSS v4 · shadcn/ui canary (Base UI–backed) · Recharts |
| Database | Neon serverless Postgres via `@neondatabase/serverless` |
| ML | scikit-learn logistic regression · joblib serialization |
| ML serving | Vercel Python runtime (`api/predict.py`) |
| Seed data | Python + Faker |
| Table | TanStack Table v8 |

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **Python** 3.11 or later
- A **[Neon](https://neon.tech)** account (free tier is sufficient)

### 1. Clone and install

```bash
git clone https://github.com/J12003LPZ/retention-iq.git
cd retention_iq
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your values:

```env
# Neon — get from https://console.neon.tech/
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require

# Read-only role used by the SQL Explorer (created in migration 003)
DATABASE_URL_READONLY=postgresql://retentioniq_ro:PASSWORD@HOST/DBNAME?sslmode=require

# Optional: override the model artifact path (default shown)
CHURN_MODEL_PATH=./public/model/churn_model.joblib
```

### 3. Run database migrations

```bash
npm run db:migrate
# equivalent: npx tsx db/migrate.ts
```

This applies all migrations under `db/migrations/` in order, including the one that creates the `retentioniq_ro` read-only Postgres role used by the SQL Explorer.

### 4. Generate seed data

```bash
pip install -r scripts/requirements.txt
python scripts/seed.py
```

Populates customers, subscriptions, usage events, payments, and support tickets using Faker-generated realistic data.

### 5. Train the churn model

```bash
python scripts/train_model.py
```

Fits a logistic regression pipeline on the seeded data, writes `public/model/churn_model.joblib`, and upserts per-customer churn probabilities and feature importance scores into the database.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs with Turbopack.

---

## Project Structure

```
retention_iq/
├── app/
│   ├── (dashboard)/          # All dashboard pages (layout + route groups)
│   │   ├── page.tsx          # Overview
│   │   ├── customers/        # Customer Health table + drawer
│   │   ├── cohorts/          # Cohort retention heatmap
│   │   ├── revenue/          # Revenue Risk
│   │   ├── support/          # Support Analytics
│   │   ├── predictions/      # Churn Predictions
│   │   ├── recommendations/  # Action cards
│   │   └── sql-explorer/     # Sandboxed SQL tool
│   └── api/                  # Next.js API routes (ISR, read-only guard)
├── api/
│   └── predict.py            # Vercel Python runtime — ML inference endpoint
├── components/               # Shared UI components (KpiCard, HealthGauge, …)
├── db/
│   ├── migrate.ts            # Migration runner
│   └── migrations/           # Numbered SQL migration files
├── lib/
│   ├── db.ts                 # Lazy Proxy DB client (safe at build time)
│   ├── queries/              # All SQL in *.sql.ts files — never inlined in components
│   ├── format.ts             # Number / currency / date formatters
│   └── types.ts              # Shared TypeScript types
├── scripts/
│   ├── seed.py               # Faker-based seed data generator
│   ├── train_model.py        # Model training + DB upsert
│   └── requirements.txt      # Python dependencies
├── public/
│   └── model/
│       └── churn_model.joblib  # Trained pipeline artifact (gitignored)
└── notebooks/                # EDA Jupyter notebook
```

---

## ML Model

The churn model is a **scikit-learn `Pipeline`** composed of a `StandardScaler` followed by `LogisticRegression` (up to 2,000 iterations). It is trained on seven features derived entirely from operational database tables:

| Feature | Description |
|---|---|
| `logins_60d` | Login events in the last 60 days |
| `usage_delta` | Change in logins vs. prior 60-day window |
| `tickets_90d` | Support tickets opened in the last 90 days |
| `open_tickets` | Currently unresolved support tickets |
| `failed_payments_180d` | Failed payment attempts in the last 180 days |
| `plan_rank` | Ordinal plan tier (starter=1 … enterprise=4) |
| `mrr_dollars` | Monthly recurring revenue in dollars |

After fitting, `train_model.py` scores every customer, computes the top-3 feature contributions per customer using scaled coefficients, and writes results directly to the `churn_predictions` and `model_feature_importance` tables. The `api/predict.py` endpoint loads the serialized pipeline at runtime and serves real-time probability scores.

---

## Security

**Read-only database role** — The SQL Explorer and all dashboard read queries use the `retentioniq_ro` Postgres role created in migration 003. This role has `SELECT`-only privileges and cannot modify data.

**Forbidden keyword protection** — The SQL Explorer rejects queries containing DDL and DML keywords (`DROP`, `INSERT`, `UPDATE`, `DELETE`, `ALTER`, `TRUNCATE`, `CREATE`, `GRANT`, and others) before they reach the database.

**Row and time caps** — SQL Explorer queries are limited to 500 rows and a 5-second statement timeout enforced at the Postgres session level.

**Model path guard** — `api/predict.py` validates that `CHURN_MODEL_PATH` resolves within `public/model/` at startup, preventing path-traversal attacks from environment variable manipulation.

---

## License

MIT © 2026
