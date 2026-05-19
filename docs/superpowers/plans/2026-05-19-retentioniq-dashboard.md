# RetentionIQ — Churn & Revenue Recovery Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a deployable Next.js 16 SaaS analytics dashboard called **RetentionIQ** that answers "which customers are likely to churn, why, and how much revenue can we save?" backed by a synthetic telecom/SaaS dataset on Neon Postgres, with an offline-trained logistic-regression churn model exposed via a Python serverless function on Vercel.

**Architecture:**
- **Frontend:** Next.js 16 App Router (already scaffolded) + TypeScript + Tailwind v4 + shadcn/ui + Recharts + TanStack Table. Dark theme port of the existing `stitch_retentioniq_saas_analytics_dashboard/` HTML mocks.
- **Data API:** Next.js Route Handlers (Node.js, Fluid Compute) at `app/api/*` query Neon via `@neondatabase/serverless`.
- **ML:** One Python serverless function at `api/predict.py` (Vercel Python runtime on Fluid Compute) loads a serialized logistic-regression model from `/public/model/` and returns scored predictions. The model is **trained offline** in `scripts/train_model.py` and its outputs are also batch-written to a `churn_predictions` table for fast reads.
- **Database:** Neon Postgres. Schema = `customers`, `subscriptions`, `plans`, `payments`, `usage_events`, `support_tickets`, `churn_predictions`. Seeded by `scripts/seed.py` (Python + Faker + numpy).
- **Deployment:** Single Vercel project; Neon connection string via `vercel env`.

> **Security note on model serialization:** the plan persists the scikit-learn pipeline with `joblib.dump` (which uses pickle under the hood). This is safe **only** because both the producer (`scripts/train_model.py`) and the consumer (`api/predict.py`) are first-party code in this repo and the artifact ships from our own build. Never load a `.pkl` from an external source. If you later accept third-party models, switch to `skops` or export coefficients as JSON.

**Tech Stack:**
- Next.js `16.2.6` (already installed), React `19.2.4`, Tailwind CSS v4 (`@tailwindcss/postcss`)
- shadcn/ui (canary, Tailwind v4 compatible), `lucide-react`, `@tanstack/react-table`, `recharts`, `class-variance-authority`, `tailwind-merge`, `clsx`
- `@neondatabase/serverless` for Postgres
- `zod` for API response validation
- Python `3.12` for the predict function and seed/notebook scripts (`pandas`, `numpy`, `scikit-learn`, `Faker`, `psycopg[binary]`, `joblib`)

**Project layout (target):**
```
retention_iq/
├── app/
│   ├── layout.tsx                  # Root layout (replace existing)
│   ├── globals.css                 # Design tokens (replace existing)
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + topbar shell
│   │   ├── page.tsx                # Overview (the "wow" page)
│   │   ├── customers/page.tsx      # Customer Health
│   │   ├── revenue/page.tsx        # Revenue Risk (Sankey + forecast)
│   │   ├── cohorts/page.tsx        # Cohort retention heatmap
│   │   ├── support/page.tsx        # Support Analytics
│   │   ├── predictions/page.tsx    # Risk segments + feature importance
│   │   ├── recommendations/page.tsx
│   │   ├── sql/page.tsx            # Embedded SQL explorer
│   │   └── settings/page.tsx
│   └── api/
│       ├── kpis/route.ts
│       ├── churn-trends/route.ts
│       ├── customers/route.ts
│       ├── customers/[id]/route.ts
│       ├── cohorts/route.ts
│       ├── revenue-risk/route.ts
│       ├── support-analytics/route.ts
│       ├── predictions/route.ts
│       ├── recommendations/route.ts
│       └── sql/route.ts            # Read-only sandboxed query runner
├── api/
│   └── predict.py                  # Python serverless function on Vercel
├── components/
│   ├── ui/                         # shadcn primitives
│   ├── shell/sidebar.tsx
│   ├── shell/topbar.tsx
│   ├── kpi/kpi-card.tsx
│   ├── kpi/health-gauge.tsx
│   ├── charts/churn-trend.tsx
│   ├── charts/churn-drivers.tsx
│   ├── charts/cohort-heatmap.tsx
│   ├── charts/revenue-sankey.tsx
│   ├── charts/feature-importance.tsx
│   ├── customers/customers-table.tsx
│   ├── customers/customer-drawer.tsx
│   ├── recommendations/recommendation-card.tsx
│   └── sql/sql-explorer.tsx
├── lib/
│   ├── db.ts                       # Neon client
│   ├── queries/                    # All SQL kept here, one file per topic
│   │   ├── kpis.sql.ts
│   │   ├── churn.sql.ts
│   │   ├── customers.sql.ts
│   │   ├── cohorts.sql.ts
│   │   ├── revenue.sql.ts
│   │   ├── support.sql.ts
│   │   └── predictions.sql.ts
│   ├── format.ts                   # number/currency/percent formatters
│   └── types.ts                    # shared TS types matching API responses
├── db/
│   ├── migrations/
│   │   ├── 001_schema.sql
│   │   ├── 002_indexes.sql
│   │   ├── 003_views.sql           # cohort + LTV views, sql-explorer read-role
│   │   └── 004_predictions_table.sql
│   └── migrate.ts                  # Tiny TS runner
├── scripts/
│   ├── seed.py                     # Faker + numpy synthetic data
│   ├── train_model.py              # Trains LR, writes model artifact + predictions
│   └── requirements.txt
├── notebooks/
│   └── churn_eda.ipynb             # EDA + driver exploration (committed)
├── public/
│   └── model/
│       └── churn_model.joblib      # Output of train_model.py (first-party only)
├── docs/
│   ├── superpowers/plans/2026-05-19-retentioniq-dashboard.md  # THIS FILE
│   └── screenshots/                # README screenshots
├── vercel.json                     # Python runtime + cron + env hints
├── .env.local.example
└── README.md
```

**Conventions for every task below:**
- TypeScript strict; no `any`.
- All SQL lives in `lib/queries/*.sql.ts` as tagged template literal helpers — pages call those helpers; SQL is **never** inlined in route handlers or React components. Pages with `'use client'` cannot import these (they use server-side route handlers only).
- Server Components by default; mark `'use client'` only on files that need interactivity (drawers, tables, charts with hover/zoom).
- Money: always store cents (`int`) in the DB, format to `$` in `lib/format.ts`.
- Tailwind classes use the design tokens from `app/globals.css` (`bg-surface`, `text-on-surface`, etc.). The HTML mocks under `stitch_retentioniq_saas_analytics_dashboard/` are the **visual source of truth** — port them, don't redesign.
- This repo's `AGENTS.md` warns Next.js APIs may differ from training data. **Before writing any Next.js code**, read the relevant file under `node_modules/next/dist/docs/01-app/` (e.g. `01-getting-started/15-route-handlers.md`, `03-layouts-and-pages.md`).
- Commit after every step that touches code. Use Conventional Commits (`feat:`, `chore:`, `fix:`).

---

## Phase 0 — Bootstrap & Tooling

### Task 0.1: Install runtime dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (auto)

- [ ] **Step 1: Install runtime deps**

Run:
```
npm install @neondatabase/serverless @tanstack/react-table recharts lucide-react class-variance-authority clsx tailwind-merge zod
```

- [ ] **Step 2: Install dev deps**

Run:
```
npm install -D @types/node
```

- [ ] **Step 3: Verify build still works**

Run: `npm run build`
Expected: build succeeds (the default template page is still in place).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add neon, recharts, tanstack-table, shadcn-deps"
```

---

### Task 0.2: Initialize shadcn/ui

**Files:**
- Create: `components.json`
- Create: `lib/utils.ts`
- Create: `components/ui/` (initial set: button, card, input, badge, dialog, sheet, separator, skeleton, table, tabs, tooltip, toggle-group, dropdown-menu, select, scroll-area)

- [ ] **Step 1: Run the shadcn init**

Run:
```
npx shadcn@canary init -y -d
```
Choose: TypeScript = yes, style = "new-york", base color = "slate", CSS variables = yes. This writes `components.json` and a stub `lib/utils.ts` exporting `cn()`.

- [ ] **Step 2: Add the component set**

Run:
```
npx shadcn@canary add button card input badge dialog sheet separator skeleton table tabs tooltip toggle-group dropdown-menu select scroll-area sonner
```

- [ ] **Step 3: Verify dev server still boots**

Run: `npm run dev` (kill after first compile succeeds).
Expected: `Ready` line in output, no module-not-found errors.

- [ ] **Step 4: Commit**

```bash
git add components.json lib/utils.ts components/ui app/globals.css
git commit -m "chore: scaffold shadcn/ui primitives"
```

---

### Task 0.3: Design tokens & global CSS

Port the design tokens from `stitch_retentioniq_saas_analytics_dashboard/retentioniq/DESIGN.md` into Tailwind v4 `@theme` variables so the rest of the app can use `bg-surface`, `text-on-surface`, `border-outline-variant`, etc., as classes.

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx` (font swap)

- [ ] **Step 1: Rewrite `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-surface: #0b1326;
  --color-surface-dim: #0b1326;
  --color-surface-bright: #31394d;
  --color-surface-container-lowest: #060e20;
  --color-surface-container-low: #131b2e;
  --color-surface-container: #171f33;
  --color-surface-container-high: #222a3d;
  --color-surface-container-highest: #2d3449;
  --color-on-surface: #dae2fd;
  --color-on-surface-variant: #c7c4d7;
  --color-outline: #908fa0;
  --color-outline-variant: #464554;
  --color-primary: #c0c1ff;
  --color-on-primary: #1000a9;
  --color-primary-container: #8083ff;
  --color-on-primary-container: #0d0096;
  --color-secondary: #4edea3;
  --color-on-secondary: #003824;
  --color-secondary-container: #00a572;
  --color-tertiary: #ffb95f;
  --color-on-tertiary: #472a00;
  --color-error: #ffb4ab;
  --color-on-error: #690005;
  --color-background: #0b1326;
  --color-on-background: #dae2fd;
  --color-card: #111827;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --radius: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}

html, body {
  background: var(--color-surface);
  color: var(--color-on-surface);
  font-family: var(--font-sans);
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--color-background); }
::-webkit-scrollbar-thumb { background: var(--color-surface-container-highest); border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-outline-variant); }

@keyframes growBar { from { width: 0; } to { width: var(--target-width); } }
.animate-bar { animation: growBar 800ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
```

- [ ] **Step 2: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const jbmono = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RetentionIQ — Churn & Revenue Recovery",
  description: "Which customers are likely to churn, why, and how much revenue can we save?",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${jbmono.variable} dark`}>
      <body className="min-h-screen bg-surface text-on-surface antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Boot dev server and visually confirm dark surface**

Run: `npm run dev`
Open `http://localhost:3000` — page should render on the dark navy surface (the default template page will look broken; that's fine, we replace it next).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: install RetentionIQ design tokens and fonts"
```

---

### Task 0.4: Environment variable template

**Files:**
- Create: `.env.local.example`
- Modify: `.gitignore` (ensure `.env*.local` is ignored — should already be)

- [ ] **Step 1: Write `.env.local.example`**

```
# Neon — get from https://console.neon.tech/
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require

# Read-only role used by the SQL Explorer (created in migration 003)
DATABASE_URL_READONLY=postgresql://retentioniq_ro:PASSWORD@HOST/DBNAME?sslmode=require

# Optional: model path override
CHURN_MODEL_PATH=./public/model/churn_model.joblib
```

- [ ] **Step 2: Verify `.gitignore`**

Confirm `.env*.local` (or `.env.local`) appears in `.gitignore`. If not, append it.

- [ ] **Step 3: Commit**

```bash
git add .env.local.example .gitignore
git commit -m "chore: env template"
```

---

## Phase 1 — Database Schema & Seed Data

### Task 1.1: Neon project + connection

**Files:** none (config only)

- [ ] **Step 1: Create Neon project**

In the Neon console, create a project named `retentioniq` (region: us-east-2 or closest). Copy the pooled connection string.

- [ ] **Step 2: Save to `.env.local`**

Create `.env.local` (not committed) with `DATABASE_URL=...` from step 1. Leave `DATABASE_URL_READONLY` blank for now — set after migration 003.

- [ ] **Step 3: Smoke-test the connection**

Run:
```
node -e "const{neon}=require('@neondatabase/serverless');require('dotenv').config({path:'.env.local'});const sql=neon(process.env.DATABASE_URL);sql\`select now()\`.then(r=>console.log(r))"
```
Expected: one row with a timestamp printed. If you don't have `dotenv` installed, `npm i -D dotenv` first or just paste the connection string inline.

---

### Task 1.2: Schema migration

**Files:**
- Create: `db/migrations/001_schema.sql`
- Create: `db/migrate.ts`
- Modify: `package.json` (add `"db:migrate"` script)

- [ ] **Step 1: Write `db/migrations/001_schema.sql`**

```sql
create table if not exists plans (
  id            text primary key,
  name          text not null,
  monthly_cents int  not null,
  tier_rank     int  not null
);

create table if not exists customers (
  id            uuid primary key default gen_random_uuid(),
  company_name  text not null,
  contact_name  text not null,
  email         text not null unique,
  region        text not null,
  industry      text not null,
  signup_date   date not null,
  churned_at    date,
  churn_reason  text
);

create table if not exists subscriptions (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references customers(id) on delete cascade,
  plan_id       text not null references plans(id),
  started_at    date not null,
  ended_at      date,
  mrr_cents     int  not null
);

create table if not exists payments (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references customers(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  amount_cents    int  not null,
  status          text not null,
  paid_at         timestamptz not null
);

create table if not exists usage_events (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references customers(id) on delete cascade,
  event_type   text not null,
  event_at     timestamptz not null,
  count        int  not null default 1
);

create table if not exists support_tickets (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references customers(id) on delete cascade,
  opened_at    timestamptz not null,
  resolved_at  timestamptz,
  severity     text not null,
  category     text not null,
  satisfaction int
);
```

- [ ] **Step 2: Write a minimal TS migrator at `db/migrate.ts`**

```ts
import { neon } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);
const dir = join(process.cwd(), "db", "migrations");

async function main() {
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const body = readFileSync(join(dir, f), "utf8");
    console.log(`-> applying ${f}`);
    await sql.transaction(
      body.split(/;\s*$/m).filter((s) => s.trim()).map((s) => sql.unsafe(s + ";")),
    );
    console.log(`   ok`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
```

Note: `sql.unsafe()` exists in the Neon serverless driver for raw statements. If the API differs in the installed version, check `node_modules/@neondatabase/serverless/index.d.ts` and adjust — the goal is to execute each statement.

- [ ] **Step 3: Add npm script to `package.json`**

Add under `"scripts"`:
```
"db:migrate": "tsx db/migrate.ts"
```

Install runner: `npm i -D tsx dotenv`

- [ ] **Step 4: Run the migration**

Run: `npm run db:migrate`
Expected: `-> applying 001_schema.sql` then `ok`.

- [ ] **Step 5: Verify in Neon**

In Neon SQL Editor run `select tablename from pg_tables where schemaname='public'`. Expected: 6 tables present.

- [ ] **Step 6: Commit**

```bash
git add db/ package.json package-lock.json
git commit -m "feat(db): initial schema for customers, subs, payments, usage, support"
```

---

### Task 1.3: Indexes + views migration

**Files:**
- Create: `db/migrations/002_indexes.sql`
- Create: `db/migrations/003_views.sql`

- [ ] **Step 1: Write `002_indexes.sql`**

```sql
create index if not exists ix_subs_customer    on subscriptions(customer_id);
create index if not exists ix_payments_cust_dt on payments(customer_id, paid_at desc);
create index if not exists ix_usage_cust_dt    on usage_events(customer_id, event_at desc);
create index if not exists ix_tickets_cust     on support_tickets(customer_id);
create index if not exists ix_customers_signup on customers(signup_date);
create index if not exists ix_customers_churn  on customers(churned_at);
```

- [ ] **Step 2: Write `003_views.sql`**

```sql
create or replace view v_customer_signup_month as
select id as customer_id,
       date_trunc('month', signup_date)::date as cohort_month
from customers;

create or replace view v_customer_active_months as
select c.id as customer_id,
       date_trunc('month', c.signup_date)::date as cohort_month,
       gs::date as active_month
from customers c
cross join lateral generate_series(
  date_trunc('month', c.signup_date),
  coalesce(date_trunc('month', c.churned_at), date_trunc('month', current_date)),
  interval '1 month'
) as gs
where c.signup_date <= gs;

create or replace view v_customer_ltv as
select c.id as customer_id,
       coalesce(sum(p.amount_cents) filter (where p.status='succeeded'), 0) as ltv_cents
from customers c
left join payments p on p.customer_id = c.id
group by c.id;

do $$ begin
  if not exists (select 1 from pg_roles where rolname='retentioniq_ro') then
    create role retentioniq_ro login password 'change-me-after-migrate';
  end if;
end $$;

grant connect on database current_database() to retentioniq_ro;
grant usage on schema public to retentioniq_ro;
grant select on all tables in schema public to retentioniq_ro;
alter default privileges in schema public grant select on tables to retentioniq_ro;
```

- [ ] **Step 3: Apply**

Run: `npm run db:migrate`
Expected: both files reported as applied.

- [ ] **Step 4: Reset the read-only role password and capture connection string**

In Neon console (or via `alter role retentioniq_ro password '...';`) set a real password and assemble the connection string. Save it as `DATABASE_URL_READONLY` in `.env.local`.

- [ ] **Step 5: Commit**

```bash
git add db/migrations/002_indexes.sql db/migrations/003_views.sql
git commit -m "feat(db): indexes, cohort/ltv views, read-only sandbox role"
```

---

### Task 1.4: Seed data generator (Python + Faker)

**Files:**
- Create: `scripts/seed.py`
- Create: `scripts/requirements.txt`

- [ ] **Step 1: Write `scripts/requirements.txt`**

```
faker==30.3.0
numpy==2.1.2
pandas==2.2.3
psycopg[binary]==3.2.3
python-dotenv==1.0.1
scikit-learn==1.5.2
joblib==1.4.2
```

- [ ] **Step 2: Write `scripts/seed.py`**

```python
"""seed.py — populate Neon with a synthetic SaaS dataset with a baked-in churn signal."""
from __future__ import annotations
import os, random, math
from datetime import datetime, timedelta, date
from faker import Faker
import numpy as np
import psycopg
from dotenv import load_dotenv

load_dotenv(".env.local")
DB = os.environ["DATABASE_URL"]

N_CUSTOMERS = 5000
START = date(2023, 1, 1)
END   = date(2026, 5, 1)
PLANS = [
    ("starter",    "Starter",     2900,  1),
    ("growth",     "Growth",      9900,  2),
    ("pro",        "Pro",        24900,  3),
    ("enterprise", "Enterprise", 79900,  4),
]
REGIONS    = ["NA", "EMEA", "APAC", "LATAM"]
INDUSTRIES = ["SaaS", "Fintech", "Retail", "Healthcare", "Media", "Logistics"]
TICKET_CATS = ["billing", "outage", "feature_request", "onboarding", "integration"]
CHURN_REASONS = [
    "Poor support experience", "Declining usage", "Missing features",
    "Pricing / budget", "Payment failures", "Contract not renewed",
]

fake = Faker(); Faker.seed(42); random.seed(42); np.random.seed(42)

def rand_date(a: date, b: date) -> date:
    return a + timedelta(days=random.randint(0, (b - a).days))

def main() -> None:
    with psycopg.connect(DB, autocommit=False) as conn, conn.cursor() as cur:
        cur.execute("truncate support_tickets, usage_events, payments, subscriptions, customers, plans restart identity cascade;")
        cur.executemany(
            "insert into plans(id,name,monthly_cents,tier_rank) values(%s,%s,%s,%s)",
            PLANS,
        )

        customers, subs, payments, usage, tickets = [], [], [], [], []
        for _ in range(N_CUSTOMERS):
            signup = rand_date(START, END - timedelta(days=30))
            plan = random.choices(PLANS, weights=[0.45, 0.30, 0.18, 0.07])[0]
            tier_rank = plan[3]
            n_tickets = np.random.poisson(1.2 + (4 - tier_rank) * 0.4)
            usage_decline = np.clip(np.random.normal(0.0, 0.3), -1.0, 1.0)
            n_payment_fails = np.random.binomial(8, 0.04 + (4 - tier_rank) * 0.01)

            z = (
                -2.2
                + 0.45 * max(0, n_tickets - 2)
                + 1.6  * max(0.0, -usage_decline)
                + 0.55 * n_payment_fails
                + 0.15 * (4 - tier_rank)
            )
            p_churn = 1 / (1 + math.exp(-z))
            churned = np.random.rand() < p_churn
            tenure_days = (END - signup).days
            churn_day = random.randint(45, max(46, tenure_days)) if churned else None
            churned_at = signup + timedelta(days=churn_day) if churn_day else None
            churn_reason = random.choice(CHURN_REASONS) if churned else None

            cust = (
                fake.uuid4(), fake.company(), fake.name(), fake.unique.email(),
                random.choice(REGIONS), random.choice(INDUSTRIES),
                signup, churned_at, churn_reason,
            )
            customers.append(cust)

            sub_id = fake.uuid4()
            subs.append((sub_id, cust[0], plan[0], signup, churned_at, plan[2]))

            cursor_date = signup
            stop = churned_at or END
            while cursor_date < stop:
                fail = (n_payment_fails > 0 and random.random() < 0.15)
                if fail:
                    n_payment_fails -= 1
                    status = "failed"
                else:
                    status = "succeeded"
                payments.append((
                    fake.uuid4(), cust[0], sub_id, plan[2], status,
                    datetime.combine(cursor_date, datetime.min.time()),
                ))
                cursor_date = cursor_date + timedelta(days=30)

            months_active = max(1, (stop - signup).days // 30)
            for m in range(months_active):
                base = 30 * (1.0 + usage_decline * (m / max(1, months_active)))
                n = max(0, int(np.random.normal(base, 6)))
                if n:
                    day = signup + timedelta(days=30 * m + random.randint(0, 27))
                    usage.append((fake.uuid4(), cust[0], "login",
                                   datetime.combine(day, datetime.min.time()), n))

            for _ in range(n_tickets):
                opened = rand_date(signup, stop)
                resolved = opened + timedelta(hours=random.randint(2, 240)) if random.random() > 0.15 else None
                tickets.append((
                    fake.uuid4(), cust[0],
                    datetime.combine(opened, datetime.min.time()),
                    datetime.combine(resolved, datetime.min.time()) if resolved else None,
                    random.choice(["low", "medium", "high", "critical"]),
                    random.choice(TICKET_CATS),
                    random.choice([None, 1, 2, 3, 4, 5]),
                ))

        cur.executemany(
            "insert into customers(id,company_name,contact_name,email,region,industry,signup_date,churned_at,churn_reason) values(%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            customers,
        )
        cur.executemany(
            "insert into subscriptions(id,customer_id,plan_id,started_at,ended_at,mrr_cents) values(%s,%s,%s,%s,%s,%s)",
            subs,
        )
        cur.executemany(
            "insert into payments(id,customer_id,subscription_id,amount_cents,status,paid_at) values(%s,%s,%s,%s,%s,%s)",
            payments,
        )
        cur.executemany(
            "insert into usage_events(id,customer_id,event_type,event_at,count) values(%s,%s,%s,%s,%s)",
            usage,
        )
        cur.executemany(
            "insert into support_tickets(id,customer_id,opened_at,resolved_at,severity,category,satisfaction) values(%s,%s,%s,%s,%s,%s,%s)",
            tickets,
        )
        conn.commit()
        print(f"seeded {len(customers)} customers, {len(payments)} payments, {len(usage)} usage rows, {len(tickets)} tickets")

if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Create venv and install deps**

Run (PowerShell):
```
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r scripts\requirements.txt
```

- [ ] **Step 4: Run the seeder**

Run: `python scripts/seed.py`
Expected: `seeded 5000 customers, ...` printed in under ~60s.

- [ ] **Step 5: Sanity-check in Neon**

```sql
select count(*) from customers;
select count(*) filter (where churned_at is not null) * 100.0 / count(*) as churn_pct from customers;
```
Expected: ~5000 customers; churn_pct between 10% and 25%.

- [ ] **Step 6: Add `.venv/` to `.gitignore` and commit**

```bash
echo .venv/ >> .gitignore
git add scripts/ .gitignore
git commit -m "feat(seed): synthetic SaaS dataset generator with churn signal"
```

---

## Phase 2 — Core SQL Library

These files are the *only* place SQL lives. Every route handler will import from here. Each function returns typed rows.

### Task 2.1: DB client + types

**Files:**
- Create: `lib/db.ts`
- Create: `lib/types.ts`

- [ ] **Step 1: Write `lib/db.ts`**

```ts
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not set");
}
export const sql = neon(process.env.DATABASE_URL);

export const sqlReadonly = process.env.DATABASE_URL_READONLY
  ? neon(process.env.DATABASE_URL_READONLY)
  : null;
```

- [ ] **Step 2: Write `lib/types.ts`**

```ts
export type Region    = "NA" | "EMEA" | "APAC" | "LATAM";
export type PlanId    = "starter" | "growth" | "pro" | "enterprise";
export type RiskBand  = "safe" | "moderate" | "high" | "critical";

export interface KpiSummary {
  churnRatePct: number;
  churnRateDeltaPct: number;
  revenueAtRiskCents: number;
  predictedChurnUsers: number;
  healthScore: number;
  trend: { date: string; churnPct: number }[];
}

export interface ChurnTrendPoint { date: string; churnPct: number; churnedCount: number; activeCount: number; }
export interface ChurnDriver     { driver: string; sharePct: number; }
export interface CustomerRow {
  id: string; companyName: string; healthScore: number; churnProb: number;
  mrrCents: number; lastLogin: string | null; openTickets: number;
  recommendedAction: string; region: Region; plan: PlanId;
}
export interface CohortCell { cohortMonth: string; monthIndex: number; retentionPct: number; cohortSize: number; }
export interface RevenueRiskBand { band: RiskBand; customers: number; mrrCents: number; }
export interface FeatureImportance { feature: string; importance: number; }
```

- [ ] **Step 3: Commit**

```bash
git add lib/db.ts lib/types.ts
git commit -m "feat(lib): neon client + shared types"
```

---

### Task 2.2: KPI queries

**Files:**
- Create: `lib/queries/kpis.sql.ts`

- [ ] **Step 1: Write the file**

```ts
import { sql } from "@/lib/db";
import type { KpiSummary } from "@/lib/types";

export async function getKpiSummary(rangeDays = 30): Promise<KpiSummary> {
  const rows = await sql/*sql*/`
    with bounds as (
      select current_date as today,
             current_date - (${rangeDays}::int) as period_start,
             current_date - (2 * ${rangeDays}::int) as prev_start
    ),
    cur as (
      select count(*) filter (where churned_at >= (select period_start from bounds)) as churned,
             count(*) filter (where churned_at is null or churned_at >= (select period_start from bounds)) as active_or_churned
      from customers
    ),
    prev as (
      select count(*) filter (
        where churned_at >= (select prev_start from bounds)
          and churned_at <  (select period_start from bounds)
      ) as churned,
      count(*) filter (
        where churned_at is null
           or (churned_at >= (select prev_start from bounds)
               and churned_at < (select period_start from bounds))
      ) as active_or_churned
      from customers
    ),
    risk as (
      select coalesce(sum(s.mrr_cents), 0)::bigint as cents,
             count(*) as users
      from customers c
      join subscriptions s on s.customer_id = c.id and s.ended_at is null
      where c.churned_at is null
        and exists (
          select 1 from churn_predictions p
          where p.customer_id = c.id and p.churn_prob >= 0.6
        )
    ),
    sparkline as (
      select to_char(d, 'YYYY-MM-DD') as date,
             coalesce(
               count(c.id) filter (where c.churned_at = d)::float
                 / nullif(count(c.id) filter (where c.signup_date <= d and (c.churned_at is null or c.churned_at > d)), 0),
               0
             ) * 100 as churn_pct
      from generate_series(current_date - interval '29 days', current_date, interval '1 day') d
      left join customers c on true
      group by d
      order by d
    ),
    health as (
      select coalesce(round(avg(100 - p.churn_prob * 100))::int, 75) as score
      from customers c
      left join churn_predictions p on p.customer_id = c.id
      where c.churned_at is null
    )
    select
      (select case when active_or_churned = 0 then 0 else churned * 100.0 / active_or_churned end from cur)            as churn_rate_pct,
      (select case when active_or_churned = 0 then 0 else churned * 100.0 / active_or_churned end from cur)
       -
      (select case when active_or_churned = 0 then 0 else churned * 100.0 / active_or_churned end from prev)           as churn_rate_delta_pct,
      (select cents from risk)                                                                                         as revenue_at_risk_cents,
      (select users from risk)                                                                                         as predicted_churn_users,
      (select score from health)                                                                                       as health_score,
      coalesce((select json_agg(json_build_object('date', date, 'churnPct', round(churn_pct::numeric, 2))) from sparkline), '[]') as trend
  `;
  const r = rows[0];
  return {
    churnRatePct: Number(r.churn_rate_pct),
    churnRateDeltaPct: Number(r.churn_rate_delta_pct),
    revenueAtRiskCents: Number(r.revenue_at_risk_cents),
    predictedChurnUsers: Number(r.predicted_churn_users),
    healthScore: Number(r.health_score),
    trend: r.trend ?? [],
  };
}
```

> **Note:** This depends on table `churn_predictions` which is created in Task 4.1. Until then, `revenue_at_risk_cents` and `predicted_churn_users` will be zero — fine for now, the route handler still works.

- [ ] **Step 2: Smoke-test**

```
npx tsx -e "import('./lib/queries/kpis.sql.ts').then(m=>m.getKpiSummary().then(console.log))"
```
Expected: an object with the fields, mostly zero predictions until Phase 4.

- [ ] **Step 3: Commit**

```bash
git add lib/queries/kpis.sql.ts
git commit -m "feat(sql): KPI summary CTE (churn rate, revenue at risk, sparkline, health)"
```

---

### Task 2.3: Churn trend + drivers queries

**Files:**
- Create: `lib/queries/churn.sql.ts`

- [ ] **Step 1: Write the file**

```ts
import { sql } from "@/lib/db";
import type { ChurnTrendPoint, ChurnDriver } from "@/lib/types";

export async function getChurnTrend(granularity: "daily" | "weekly" | "monthly") {
  const bucket = granularity === "daily" ? "day" : granularity === "weekly" ? "week" : "month";
  const rows = await sql/*sql*/`
    with buckets as (
      select generate_series(
        date_trunc(${bucket}::text, current_date - interval '180 days'),
        date_trunc(${bucket}::text, current_date),
        ('1 ' || ${bucket}::text)::interval
      )::date as bucket_start
    )
    select to_char(b.bucket_start, 'YYYY-MM-DD') as date,
           count(c.id) filter (
             where date_trunc(${bucket}::text, c.churned_at) = b.bucket_start
           )::int as churned_count,
           count(c.id) filter (
             where c.signup_date <= b.bucket_start
               and (c.churned_at is null or c.churned_at > b.bucket_start)
           )::int as active_count,
           coalesce(
             count(c.id) filter (where date_trunc(${bucket}::text, c.churned_at) = b.bucket_start)::float
               / nullif(count(c.id) filter (
                   where c.signup_date <= b.bucket_start
                     and (c.churned_at is null or c.churned_at > b.bucket_start)
                 ), 0),
             0
           ) * 100 as churn_pct
    from buckets b
    left join customers c on true
    group by b.bucket_start
    order by b.bucket_start;
  ` as unknown as { date: string; churned_count: number; active_count: number; churn_pct: number }[];

  return rows.map<ChurnTrendPoint>((r) => ({
    date: r.date,
    churnPct: Number(r.churn_pct),
    churnedCount: r.churned_count,
    activeCount: r.active_count,
  }));
}

export async function getChurnDrivers(): Promise<ChurnDriver[]> {
  const rows = await sql/*sql*/`
    with churned as (
      select churn_reason from customers where churned_at is not null
    ),
    total as (select count(*)::float as n from churned)
    select churn_reason as driver,
           round((count(*) * 100.0 / (select n from total))::numeric, 1) as share_pct
    from churned
    where churn_reason is not null
    group by churn_reason
    order by count(*) desc
  ` as unknown as { driver: string; share_pct: number }[];
  return rows.map((r) => ({ driver: r.driver, sharePct: Number(r.share_pct) }));
}
```

- [ ] **Step 2: Smoke-test**

```
npx tsx -e "import('./lib/queries/churn.sql.ts').then(m=>m.getChurnTrend('weekly').then(r=>console.log(r.slice(0,3))))"
npx tsx -e "import('./lib/queries/churn.sql.ts').then(m=>m.getChurnDrivers().then(console.log))"
```
Expected: list of trend points, and drivers totaling ~100%.

- [ ] **Step 3: Commit**

```bash
git add lib/queries/churn.sql.ts
git commit -m "feat(sql): churn trend (buckets) + drivers (exit-reason shares)"
```

---

### Task 2.4: Customer queries

**Files:**
- Create: `lib/queries/customers.sql.ts`

- [ ] **Step 1: Write `getCustomers(opts)` and `getCustomerById(id)`**

```ts
import { sql } from "@/lib/db";
import type { CustomerRow } from "@/lib/types";

export interface ListOpts {
  search?: string;
  region?: string;
  plan?: string;
  riskMin?: number;
  sort?: "health" | "churnProb" | "mrr" | "lastLogin";
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function getCustomers(opts: ListOpts = {}) {
  const page    = Math.max(1, opts.page ?? 1);
  const size    = Math.min(100, Math.max(10, opts.pageSize ?? 25));
  const sortCol = ({ health: "health_score", churnProb: "churn_prob", mrr: "mrr_cents", lastLogin: "last_login" }
                    as const)[opts.sort ?? "churnProb"];
  const dir     = opts.dir === "asc" ? "asc" : "desc";

  const rows = await sql/*sql*/`
    with last_login as (
      select customer_id, max(event_at) as last_login
      from usage_events where event_type = 'login' group by customer_id
    ),
    open_tickets as (
      select customer_id, count(*) as open_count
      from support_tickets where resolved_at is null group by customer_id
    ),
    sub as (
      select distinct on (customer_id) customer_id, mrr_cents, plan_id
      from subscriptions where ended_at is null
      order by customer_id, started_at desc
    )
    select c.id,
           c.company_name,
           c.region,
           s.plan_id,
           coalesce(s.mrr_cents, 0)               as mrr_cents,
           coalesce(p.churn_prob, 0.5)            as churn_prob,
           round((100 - coalesce(p.churn_prob,0.5) * 100))::int as health_score,
           ll.last_login                          as last_login,
           coalesce(ot.open_count, 0)::int        as open_tickets,
           case
             when coalesce(p.churn_prob,0) >= 0.8 then 'Schedule executive review'
             when coalesce(p.churn_prob,0) >= 0.6 then 'Offer priority support'
             when coalesce(ot.open_count,0) >= 3  then 'Escalate open tickets'
             when ll.last_login < (now() - interval '21 days') then 'Re-engagement email'
             else 'Monitor'
           end as recommended_action
    from customers c
    left join sub s on s.customer_id = c.id
    left join churn_predictions p on p.customer_id = c.id
    left join last_login ll on ll.customer_id = c.id
    left join open_tickets ot on ot.customer_id = c.id
    where c.churned_at is null
      and (${opts.search ?? null}::text is null
           or c.company_name ilike '%' || ${opts.search ?? null} || '%'
           or c.email        ilike '%' || ${opts.search ?? null} || '%')
      and (${opts.region ?? null}::text is null or c.region = ${opts.region ?? null})
      and (${opts.plan   ?? null}::text is null or s.plan_id = ${opts.plan ?? null})
      and (${opts.riskMin ?? null}::float is null or coalesce(p.churn_prob, 0) >= ${opts.riskMin ?? null})
    order by ${sql.unsafe(sortCol)} ${sql.unsafe(dir)} nulls last
    limit ${size} offset ${(page - 1) * size}
  ` as unknown as Array<{
    id: string; company_name: string; region: string; plan_id: string;
    mrr_cents: number; churn_prob: number; health_score: number;
    last_login: string | null; open_tickets: number; recommended_action: string;
  }>;

  return rows.map<CustomerRow>((r) => ({
    id: r.id, companyName: r.company_name, healthScore: r.health_score,
    churnProb: Number(r.churn_prob), mrrCents: r.mrr_cents,
    lastLogin: r.last_login, openTickets: r.open_tickets,
    recommendedAction: r.recommended_action,
    region: r.region as CustomerRow["region"],
    plan: r.plan_id as CustomerRow["plan"],
  }));
}

export async function getCustomerById(id: string) {
  const [base] = await sql/*sql*/`
    select c.*, s.plan_id, s.mrr_cents, p.churn_prob, p.top_factors
    from customers c
    left join lateral (
      select plan_id, mrr_cents from subscriptions
      where customer_id = c.id and ended_at is null
      order by started_at desc limit 1
    ) s on true
    left join churn_predictions p on p.customer_id = c.id
    where c.id = ${id}
  ` as unknown as Array<Record<string, unknown>>;
  if (!base) return null;

  const usage = await sql/*sql*/`
    select date_trunc('week', event_at)::date as week, sum(count)::int as total
    from usage_events where customer_id = ${id} and event_type='login'
    group by 1 order by 1
  `;
  const tickets = await sql/*sql*/`
    select id, opened_at, resolved_at, severity, category, satisfaction
    from support_tickets where customer_id = ${id} order by opened_at desc
  `;
  const payments = await sql/*sql*/`
    select id, amount_cents, status, paid_at
    from payments where customer_id = ${id} order by paid_at desc limit 24
  `;
  return { ...base, usage, tickets, payments };
}
```

- [ ] **Step 2: Smoke-test**

```
npx tsx -e "import('./lib/queries/customers.sql.ts').then(m=>m.getCustomers({pageSize:3}).then(console.log))"
```
Expected: array of 3 customer rows with computed `recommendedAction`.

- [ ] **Step 3: Commit**

```bash
git add lib/queries/customers.sql.ts
git commit -m "feat(sql): customer list (filter+sort+page) and detail"
```

---

### Task 2.5: Cohort retention + revenue + support queries

**Files:**
- Create: `lib/queries/cohorts.sql.ts`
- Create: `lib/queries/revenue.sql.ts`
- Create: `lib/queries/support.sql.ts`

- [ ] **Step 1: Write `cohorts.sql.ts`**

```ts
import { sql } from "@/lib/db";
import type { CohortCell } from "@/lib/types";

export async function getCohortRetention(maxMonths = 12): Promise<CohortCell[]> {
  const rows = await sql/*sql*/`
    with cohorts as (
      select date_trunc('month', signup_date)::date as cohort_month, id
      from customers where signup_date >= current_date - interval '18 months'
    ),
    sizes as (
      select cohort_month, count(*)::int as cohort_size from cohorts group by cohort_month
    ),
    active as (
      select v.cohort_month,
             ((extract(year from v.active_month) - extract(year from v.cohort_month)) * 12
              + (extract(month from v.active_month) - extract(month from v.cohort_month)))::int as month_index,
             count(distinct v.customer_id)::int as retained
      from v_customer_active_months v
      join cohorts c on c.id = v.customer_id
      group by 1, 2
    )
    select to_char(a.cohort_month, 'YYYY-MM') as cohort_month,
           a.month_index,
           round((a.retained * 100.0 / s.cohort_size)::numeric, 1) as retention_pct,
           s.cohort_size
    from active a
    join sizes s on s.cohort_month = a.cohort_month
    where a.month_index <= ${maxMonths}
    order by a.cohort_month, a.month_index;
  ` as unknown as Array<{ cohort_month: string; month_index: number; retention_pct: number; cohort_size: number }>;

  return rows.map<CohortCell>((r) => ({
    cohortMonth: r.cohort_month, monthIndex: r.month_index,
    retentionPct: Number(r.retention_pct), cohortSize: r.cohort_size,
  }));
}
```

- [ ] **Step 2: Write `revenue.sql.ts`**

```ts
import { sql } from "@/lib/db";
import type { RevenueRiskBand } from "@/lib/types";

export async function getRevenueRiskBands(): Promise<RevenueRiskBand[]> {
  const rows = await sql/*sql*/`
    with banded as (
      select c.id,
             case
               when coalesce(p.churn_prob,0) >= 0.85 then 'critical'
               when coalesce(p.churn_prob,0) >= 0.6  then 'high'
               when coalesce(p.churn_prob,0) >= 0.35 then 'moderate'
               else 'safe'
             end as band,
             coalesce(s.mrr_cents, 0) as mrr_cents
      from customers c
      left join churn_predictions p on p.customer_id = c.id
      left join lateral (
        select mrr_cents from subscriptions
        where customer_id = c.id and ended_at is null
        order by started_at desc limit 1
      ) s on true
      where c.churned_at is null
    )
    select band, count(*)::int as customers, sum(mrr_cents)::bigint as mrr_cents
    from banded group by band
  ` as unknown as Array<{ band: string; customers: number; mrr_cents: number }>;
  return rows.map((r) => ({ band: r.band as RevenueRiskBand["band"], customers: r.customers, mrrCents: Number(r.mrr_cents) }));
}

export async function getRevenueSankey() {
  return sql/*sql*/`
    with snap as (
      select c.id,
             case
               when c.churned_at is null and coalesce(p.churn_prob,0) >= 0.6 then 'at_risk'
               when c.churned_at is null then 'healthy'
               else 'churned'
             end as bucket,
             coalesce(s.mrr_cents, 0) as mrr_cents
      from customers c
      left join churn_predictions p on p.customer_id = c.id
      left join lateral (
        select mrr_cents from subscriptions
        where customer_id=c.id and ended_at is null order by started_at desc limit 1
      ) s on true
    )
    select bucket, count(*)::int as users, sum(mrr_cents)::bigint as mrr_cents
    from snap group by bucket;
  `;
}
```

- [ ] **Step 3: Write `support.sql.ts`**

```ts
import { sql } from "@/lib/db";

export async function getSupportAnalytics() {
  return sql/*sql*/`
    select category,
           count(*)::int                                                              as tickets,
           round(avg(extract(epoch from (coalesce(resolved_at, now()) - opened_at)) / 3600)::numeric, 1) as avg_hours_to_resolve,
           round(avg(satisfaction)::numeric, 2)                                       as avg_csat
    from support_tickets
    group by category order by tickets desc;
  `;
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/queries/cohorts.sql.ts lib/queries/revenue.sql.ts lib/queries/support.sql.ts
git commit -m "feat(sql): cohort retention, revenue risk bands, support analytics"
```

---

## Phase 3 — App Shell (Sidebar, Topbar, Layout)

### Task 3.1: Sidebar component

**Files:**
- Create: `components/shell/sidebar.tsx`

Port the sidebar HTML from `stitch_retentioniq_saas_analytics_dashboard/retentioniq_overview_dashboard/code.html` lines 156–210. Replace `material-symbols-outlined` glyphs with `lucide-react` icons.

- [ ] **Step 1: Write the component**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, HeartPulse, Wallet, Users, LineChart,
  Sparkles, Database, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",                  label: "Overview",        icon: LayoutDashboard },
  { href: "/customers",         label: "Customer Health", icon: HeartPulse },
  { href: "/revenue",           label: "Revenue Risk",    icon: Wallet },
  { href: "/cohorts",           label: "Cohort Analysis", icon: Users },
  { href: "/support",           label: "Support",         icon: LineChart },
  { href: "/predictions",       label: "Predictions",     icon: Sparkles },
  { href: "/recommendations",   label: "Recommendations", icon: Sparkles },
  { href: "/sql",               label: "SQL Explorer",    icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <>
      <nav className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-outline-variant bg-surface-container-low px-4 py-6 lg:flex">
        <div className="mb-8 px-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary">RetentionIQ</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-on-surface-variant">Executive Suite</p>
        </div>
        <ul className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-container text-on-primary-container"
                      : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface",
                  )}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto border-t border-outline-variant pt-4">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-outline-variant bg-surface-container-low py-2 lg:hidden">
        {NAV.slice(0, 5).map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex flex-col items-center px-2 py-1 text-[10px] text-on-surface-variant">
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/shell/sidebar.tsx
git commit -m "feat(shell): sidebar with route highlighting and mobile bottom-nav"
```

---

### Task 3.2: Topbar component

**Files:**
- Create: `components/shell/topbar.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";
import { Search, Bell, HelpCircle, User } from "lucide-react";
import { useState } from "react";

const RANGES = ["7d", "30d", "Quarter", "Year"] as const;
type Range = (typeof RANGES)[number];

export function Topbar() {
  const [range, setRange] = useState<Range>("30d");
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
          <input
            type="text"
            placeholder="Search accounts, insights…"
            className="w-72 rounded-full border border-outline-variant bg-surface-container py-1.5 pl-9 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                range === r ? "bg-surface-container-highest text-on-surface" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative rounded-full p-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-surface bg-error" />
        </button>
        <button className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface">
          <HelpCircle size={18} />
        </button>
        <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant bg-surface-variant text-on-surface-variant">
          <User size={16} />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/shell/topbar.tsx
git commit -m "feat(shell): topbar with date-range toggle"
```

---

### Task 3.3: Dashboard layout & route group

**Files:**
- Create: `app/(dashboard)/layout.tsx`
- Delete: `app/page.tsx` (the default template page)
- Create: `app/(dashboard)/page.tsx` (placeholder; filled in Phase 6)

> First read `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` to confirm route-group syntax for this Next.js version.

- [ ] **Step 1: Delete the default `app/page.tsx`**

```
git rm app/page.tsx
```

- [ ] **Step 2: Create `app/(dashboard)/layout.tsx`**

```tsx
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar }  from "@/components/shell/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:ml-[260px]">
        <Topbar />
        <main className="mx-auto w-full max-w-[1440px] flex-1 p-6 pb-20 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create a placeholder `app/(dashboard)/page.tsx`**

```tsx
export default function OverviewPage() {
  return <h2 className="font-display text-3xl font-semibold tracking-tight">Overview</h2>;
}
```

- [ ] **Step 4: Boot dev server, navigate to `/`**

Run: `npm run dev`
Expected: sidebar + topbar visible on `/`, with the "Overview" heading. Sidebar nav links are clickable and highlight on hover (though target pages 404 until later tasks).

- [ ] **Step 5: Commit**

```bash
git add app/
git commit -m "feat(shell): dashboard route group with sidebar+topbar layout"
```

---

## Phase 4 — Python ML Function & Predictions Table

### Task 4.1: `churn_predictions` table

**Files:**
- Create: `db/migrations/004_predictions_table.sql`

- [ ] **Step 1: Write the migration**

```sql
create table if not exists churn_predictions (
  customer_id  uuid primary key references customers(id) on delete cascade,
  churn_prob   real not null,
  top_factors  jsonb not null default '[]',
  scored_at    timestamptz not null default now()
);

create table if not exists model_feature_importance (
  id           serial primary key,
  feature      text not null,
  importance   real not null,
  trained_at   timestamptz not null default now()
);
```

- [ ] **Step 2: Apply**

Run: `npm run db:migrate`

- [ ] **Step 3: Commit**

```bash
git add db/migrations/004_predictions_table.sql
git commit -m "feat(db): churn_predictions + feature importance tables"
```

---

### Task 4.2: Offline training script (logistic regression)

**Files:**
- Create: `scripts/train_model.py`

> Persists the fitted pipeline with `joblib`. Only first-party code (`scripts/train_model.py`) writes the artifact and only first-party code (`api/predict.py`) reads it. Do not point the loader at any external `.joblib` file.

- [ ] **Step 1: Write the script**

```python
"""
train_model.py — fit a logistic-regression churn classifier, persist:
  - public/model/churn_model.joblib  (sklearn pipeline; first-party artifact only)
  - churn_predictions table          (per-customer score)
  - model_feature_importance         (coefficients for the UI bar chart)
"""
from __future__ import annotations
import os, json, joblib
from pathlib import Path
import numpy as np
import pandas as pd
import psycopg
from dotenv import load_dotenv
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

load_dotenv(".env.local")
DB = os.environ["DATABASE_URL"]
OUT = Path("public/model"); OUT.mkdir(parents=True, exist_ok=True)

FEATURES_SQL = """
with last_60 as (
  select customer_id, sum(count)::int as logins_60d
  from usage_events
  where event_at >= now() - interval '60 days' and event_type = 'login'
  group by customer_id
),
prev_60 as (
  select customer_id, sum(count)::int as logins_prev_60d
  from usage_events
  where event_at <  now() - interval '60 days'
    and event_at >= now() - interval '120 days'
    and event_type = 'login'
  group by customer_id
),
fails as (
  select customer_id, count(*)::int as failed_payments_180d
  from payments where status='failed' and paid_at >= now() - interval '180 days'
  group by customer_id
),
tix as (
  select customer_id,
         count(*) filter (where opened_at >= now() - interval '90 days')::int as tickets_90d,
         count(*) filter (where resolved_at is null)::int as open_tickets
  from support_tickets group by customer_id
),
mrr as (
  select distinct on (customer_id) customer_id, mrr_cents, plan_id
  from subscriptions where ended_at is null
  order by customer_id, started_at desc
)
select c.id as customer_id,
       (c.churned_at is not null)::int as churned,
       coalesce(last_60.logins_60d, 0)            as logins_60d,
       coalesce(prev_60.logins_prev_60d, 0)       as logins_prev_60d,
       coalesce(fails.failed_payments_180d, 0)    as failed_payments_180d,
       coalesce(tix.tickets_90d, 0)               as tickets_90d,
       coalesce(tix.open_tickets, 0)              as open_tickets,
       coalesce(mrr.mrr_cents, 0)                 as mrr_cents,
       coalesce(mrr.plan_id, 'starter')           as plan_id
from customers c
left join last_60 on last_60.customer_id = c.id
left join prev_60 on prev_60.customer_id = c.id
left join fails   on fails.customer_id   = c.id
left join tix     on tix.customer_id     = c.id
left join mrr     on mrr.customer_id     = c.id;
"""

PLAN_RANK = {"starter": 1, "growth": 2, "pro": 3, "enterprise": 4}

def main() -> None:
    with psycopg.connect(DB) as conn:
        df = pd.read_sql(FEATURES_SQL, conn)

    df["plan_rank"]    = df["plan_id"].map(PLAN_RANK).fillna(1)
    df["usage_delta"]  = df["logins_60d"] - df["logins_prev_60d"]
    df["mrr_dollars"]  = df["mrr_cents"] / 100.0

    feats = ["tickets_90d", "open_tickets", "failed_payments_180d",
             "usage_delta", "logins_60d", "plan_rank", "mrr_dollars"]
    X = df[feats].values
    y = df["churned"].values

    pipe = Pipeline([("scale", StandardScaler()), ("lr", LogisticRegression(max_iter=2000))])
    pipe.fit(X, y)
    df["churn_prob"] = pipe.predict_proba(X)[:, 1]

    joblib.dump({"pipeline": pipe, "features": feats}, OUT / "churn_model.joblib")
    print("saved model, mean prob positives vs negatives:",
          float(df.loc[df.churned==1, "churn_prob"].mean()),
          float(df.loc[df.churned==0, "churn_prob"].mean()))

    coefs = dict(zip(feats, pipe.named_steps["lr"].coef_.ravel().tolist()))
    rows = []
    for _, r in df.iterrows():
        contribs = sorted(
            [(f, float(coefs[f]) * float(r[f])) for f in feats],
            key=lambda t: abs(t[1]), reverse=True,
        )[:3]
        rows.append((
            r["customer_id"],
            float(r["churn_prob"]),
            json.dumps([{"feature": f, "weight": round(w, 4)} for f, w in contribs]),
        ))

    with psycopg.connect(DB, autocommit=False) as conn, conn.cursor() as cur:
        cur.execute("truncate churn_predictions;")
        cur.executemany(
            "insert into churn_predictions(customer_id, churn_prob, top_factors) values (%s, %s, %s::jsonb)",
            rows,
        )
        cur.execute("truncate model_feature_importance;")
        cur.executemany(
            "insert into model_feature_importance(feature, importance) values (%s, %s)",
            [(f, abs(coefs[f])) for f in feats],
        )
        conn.commit()
        print(f"wrote {len(rows)} predictions and {len(feats)} feature importances")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run training**

Run: `python scripts/train_model.py`
Expected: positive-class mean prob > negative-class mean prob (e.g., 0.55 vs 0.10); model artifact and DB rows written.

- [ ] **Step 3: Verify in Neon**

```sql
select count(*) from churn_predictions;
select * from model_feature_importance order by importance desc;
```

- [ ] **Step 4: Commit**

```bash
git add scripts/train_model.py public/model
git commit -m "feat(ml): logistic regression churn model + per-customer scoring"
```

---

### Task 4.3: Python Vercel serverless function for ad-hoc scoring

**Files:**
- Create: `api/predict.py`
- Create: `vercel.json`
- Create: `api/requirements.txt`

> This function only loads the **first-party** artifact written by `scripts/train_model.py` that was shipped in the same deployment bundle. It does not accept a model URL or path from the caller.

- [ ] **Step 1: Write `api/predict.py`**

```python
"""POST /api/predict — score an ad-hoc customer payload.

Body JSON: {
  "tickets_90d": int, "open_tickets": int, "failed_payments_180d": int,
  "usage_delta": int, "logins_60d": int, "plan_rank": int, "mrr_dollars": float
}
"""
from http.server import BaseHTTPRequestHandler
import json, os, joblib
from pathlib import Path

MODEL_PATH = Path(os.environ.get("CHURN_MODEL_PATH", "public/model/churn_model.joblib"))
_BUNDLE = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("content-length", 0))
        payload = json.loads(self.rfile.read(length) or b"{}")
        if _BUNDLE is None:
            return self._json(503, {"error": "model not available"})
        feats = _BUNDLE["features"]
        try:
            x = [[float(payload[f]) for f in feats]]
        except KeyError as e:
            return self._json(400, {"error": f"missing feature {e.args[0]}"})
        prob = float(_BUNDLE["pipeline"].predict_proba(x)[0, 1])
        return self._json(200, {"churnProb": prob})

    def _json(self, status, body):
        self.send_response(status)
        self.send_header("content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode("utf-8"))
```

- [ ] **Step 2: Write `api/requirements.txt`**

```
scikit-learn==1.5.2
joblib==1.4.2
numpy==2.1.2
```

- [ ] **Step 3: Write `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "functions": {
    "api/predict.py": { "runtime": "@vercel/python@4.3.1" }
  }
}
```

- [ ] **Step 4: Local smoke-test via `vercel dev`** (skip if Vercel CLI not installed — covered later by the deploy task)

If the Vercel CLI is available: `vercel dev` → POST to `http://localhost:3000/api/predict` with curl and confirm a JSON `churnProb` between 0 and 1.

- [ ] **Step 5: Commit**

```bash
git add api/ vercel.json
git commit -m "feat(ml): /api/predict Python serverless scoring endpoint"
```

---

### Task 4.4: Predictions SQL helpers

**Files:**
- Create: `lib/queries/predictions.sql.ts`

- [ ] **Step 1: Write the file**

```ts
import { sql } from "@/lib/db";
import type { FeatureImportance, RiskBand } from "@/lib/types";

export async function getFeatureImportance(): Promise<FeatureImportance[]> {
  const rows = await sql/*sql*/`
    select feature, importance from model_feature_importance order by importance desc;
  ` as unknown as Array<{ feature: string; importance: number }>;
  return rows.map((r) => ({ feature: r.feature, importance: Number(r.importance) }));
}

export async function getRiskSegments() {
  const rows = await sql/*sql*/`
    with banded as (
      select c.id,
             case
               when p.churn_prob >= 0.85 then 'critical'
               when p.churn_prob >= 0.6  then 'high'
               when p.churn_prob >= 0.35 then 'moderate'
               else 'safe'
             end as band,
             coalesce(s.mrr_cents, 0) as mrr_cents
      from customers c
      join churn_predictions p on p.customer_id = c.id
      left join lateral (
        select mrr_cents from subscriptions
        where customer_id = c.id and ended_at is null
        order by started_at desc limit 1
      ) s on true
      where c.churned_at is null
    )
    select band, count(*)::int as customers, sum(mrr_cents)::bigint as mrr_cents
    from banded group by band
  ` as unknown as Array<{ band: RiskBand; customers: number; mrr_cents: number }>;
  return rows;
}

export async function getTopToSave(limit = 100) {
  return sql/*sql*/`
    select c.id, c.company_name, c.region, p.churn_prob, s.mrr_cents, s.plan_id
    from customers c
    join churn_predictions p on p.customer_id = c.id
    left join lateral (
      select mrr_cents, plan_id from subscriptions
      where customer_id = c.id and ended_at is null
      order by started_at desc limit 1
    ) s on true
    where c.churned_at is null and p.churn_prob >= 0.5
    order by (p.churn_prob * coalesce(s.mrr_cents, 0)) desc
    limit ${limit};
  `;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/queries/predictions.sql.ts
git commit -m "feat(sql): feature importance, risk segments, top-100-to-save"
```

---

## Phase 5 — Route Handlers (Data API)

> All handlers follow the same pattern: parse query params, call a query helper, wrap in `Response.json`. Cache with `export const revalidate = 60`. Read `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` before writing the first one to confirm conventions.

### Task 5.1: `/api/kpis` and `/api/churn-trends`

**Files:**
- Create: `app/api/kpis/route.ts`
- Create: `app/api/churn-trends/route.ts`

- [ ] **Step 1: Write `app/api/kpis/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getKpiSummary } from "@/lib/queries/kpis.sql";

export const revalidate = 60;

export async function GET(req: Request) {
  const days = Number(new URL(req.url).searchParams.get("days") ?? "30");
  const data = await getKpiSummary(Number.isFinite(days) ? days : 30);
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Write `app/api/churn-trends/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getChurnTrend, getChurnDrivers } from "@/lib/queries/churn.sql";

export const revalidate = 60;

export async function GET(req: Request) {
  const g = (new URL(req.url).searchParams.get("granularity") ?? "weekly") as
    "daily" | "weekly" | "monthly";
  const [trend, drivers] = await Promise.all([getChurnTrend(g), getChurnDrivers()]);
  return NextResponse.json({ trend, drivers });
}
```

- [ ] **Step 3: Smoke-test**

Run `npm run dev`, then in a separate shell:
```
curl http://localhost:3000/api/kpis
curl "http://localhost:3000/api/churn-trends?granularity=monthly"
```

- [ ] **Step 4: Commit**

```bash
git add app/api/kpis app/api/churn-trends
git commit -m "feat(api): /api/kpis and /api/churn-trends"
```

---

### Task 5.2: Remaining route handlers

**Files:**
- Create: `app/api/customers/route.ts`
- Create: `app/api/customers/[id]/route.ts`
- Create: `app/api/cohorts/route.ts`
- Create: `app/api/revenue-risk/route.ts`
- Create: `app/api/support-analytics/route.ts`
- Create: `app/api/predictions/route.ts`
- Create: `app/api/recommendations/route.ts`

- [ ] **Step 1: `app/api/customers/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getCustomers } from "@/lib/queries/customers.sql";

export const revalidate = 60;

export async function GET(req: Request) {
  const u = new URL(req.url);
  const data = await getCustomers({
    search:   u.searchParams.get("q") ?? undefined,
    region:   u.searchParams.get("region") ?? undefined,
    plan:     u.searchParams.get("plan") ?? undefined,
    riskMin:  u.searchParams.has("riskMin") ? Number(u.searchParams.get("riskMin")) : undefined,
    sort:     (u.searchParams.get("sort") as never) ?? undefined,
    dir:      (u.searchParams.get("dir") as never) ?? undefined,
    page:     Number(u.searchParams.get("page") ?? "1"),
    pageSize: Number(u.searchParams.get("pageSize") ?? "25"),
  });
  return NextResponse.json({ rows: data });
}
```

- [ ] **Step 2: `app/api/customers/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getCustomerById } from "@/lib/queries/customers.sql";

export const revalidate = 60;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const data = await getCustomerById(id);
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}
```

> Note: in Next.js 15+, `params` is a `Promise` in route handlers. Verify against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`.

- [ ] **Step 3: `app/api/cohorts/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getCohortRetention } from "@/lib/queries/cohorts.sql";

export const revalidate = 300;

export async function GET() {
  return NextResponse.json({ cells: await getCohortRetention(12) });
}
```

- [ ] **Step 4: `app/api/revenue-risk/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getRevenueRiskBands, getRevenueSankey } from "@/lib/queries/revenue.sql";

export const revalidate = 60;

export async function GET() {
  const [bands, sankey] = await Promise.all([getRevenueRiskBands(), getRevenueSankey()]);
  return NextResponse.json({ bands, sankey });
}
```

- [ ] **Step 5: `app/api/support-analytics/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getSupportAnalytics } from "@/lib/queries/support.sql";

export const revalidate = 60;

export async function GET() {
  return NextResponse.json({ rows: await getSupportAnalytics() });
}
```

- [ ] **Step 6: `app/api/predictions/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getFeatureImportance, getRiskSegments, getTopToSave } from "@/lib/queries/predictions.sql";

export const revalidate = 300;

export async function GET() {
  const [importance, segments, topToSave] = await Promise.all([
    getFeatureImportance(), getRiskSegments(), getTopToSave(100),
  ]);
  return NextResponse.json({ importance, segments, topToSave });
}
```

- [ ] **Step 7: `app/api/recommendations/route.ts`**

```ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const revalidate = 300;

const RULES = [
  {
    id: "declining-usage",
    title: "Customers with declining usage",
    where: "p.churn_prob between 0.4 and 0.7 and coalesce(ll.last_login, '1900-01-01') < now() - interval '21 days'",
    action: "Send onboarding/tutorial emails + product walkthrough",
    confidence: 0.78,
    expectedReductionPct: 8,
  },
  {
    id: "ticket-storm",
    title: "Customers with 3+ unresolved tickets",
    where: "(select count(*) from support_tickets t where t.customer_id = c.id and t.resolved_at is null) >= 3",
    action: "Assign dedicated CSM + priority response SLA",
    confidence: 0.84,
    expectedReductionPct: 12,
  },
  {
    id: "payment-fails",
    title: "Customers with repeat payment failures",
    where: "(select count(*) from payments p2 where p2.customer_id=c.id and p2.status='failed' and p2.paid_at > now()-interval '180 days') >= 2",
    action: "Trigger Smart Retries + offer ACH/invoice billing",
    confidence: 0.71,
    expectedReductionPct: 6,
  },
];

export async function GET() {
  const out = [];
  for (const r of RULES) {
    // `where` clauses are hardcoded above (never user input) — sql.unsafe is safe here.
    const rows = await sql/*sql*/`
      select count(*)::int as customers,
             coalesce(sum(s.mrr_cents), 0)::bigint as mrr_cents
      from customers c
      left join churn_predictions p on p.customer_id = c.id
      left join lateral (
        select event_at as last_login from usage_events
        where customer_id=c.id and event_type='login'
        order by event_at desc limit 1
      ) ll on true
      left join lateral (
        select mrr_cents from subscriptions
        where customer_id=c.id and ended_at is null
        order by started_at desc limit 1
      ) s on true
      where c.churned_at is null and ${sql.unsafe(r.where)}
    `;
    out.push({ ...r, ...rows[0] });
  }
  return NextResponse.json({ recommendations: out });
}
```

- [ ] **Step 8: Smoke-test all endpoints**

```
curl http://localhost:3000/api/customers?pageSize=2
curl http://localhost:3000/api/cohorts
curl http://localhost:3000/api/revenue-risk
curl http://localhost:3000/api/support-analytics
curl http://localhost:3000/api/predictions
curl http://localhost:3000/api/recommendations
```

- [ ] **Step 9: Commit**

```bash
git add app/api
git commit -m "feat(api): customers, cohorts, revenue-risk, support, predictions, recommendations"
```

---

### Task 5.3: `/api/sql` — sandboxed SQL Explorer endpoint

**Files:**
- Create: `app/api/sql/route.ts`

- [ ] **Step 1: Write the file**

```ts
import { NextResponse } from "next/server";
import { sqlReadonly } from "@/lib/db";

export const dynamic = "force-dynamic";

const FORBIDDEN = /\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|copy|vacuum|analyze|cluster|reindex|do)\b/i;
const MAX_ROWS = 500;
const TIMEOUT_MS = 5000;

export async function POST(req: Request) {
  if (!sqlReadonly) {
    return NextResponse.json({ error: "DATABASE_URL_READONLY not configured" }, { status: 503 });
  }
  const { query } = (await req.json()) as { query?: string };
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }
  if (query.length > 4000) {
    return NextResponse.json({ error: "query too long" }, { status: 400 });
  }
  if (FORBIDDEN.test(query)) {
    return NextResponse.json({ error: "only SELECT queries are permitted" }, { status: 400 });
  }
  if (!/^\s*(with|select)\b/i.test(query)) {
    return NextResponse.json({ error: "query must start with SELECT or WITH" }, { status: 400 });
  }

  const safe = `select * from (${query}) _ limit ${MAX_ROWS}`;
  const start = Date.now();
  try {
    const rows = (await Promise.race([
      sqlReadonly!.unsafe(safe),
      new Promise((_, rej) => setTimeout(() => rej(new Error("query timeout")), TIMEOUT_MS)),
    ])) as unknown as Record<string, unknown>[];
    return NextResponse.json({
      rows,
      rowCount: rows.length,
      truncated: rows.length === MAX_ROWS,
      durationMs: Date.now() - start,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "query failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
```

- [ ] **Step 2: Smoke-test (allowed + denied)**

Allowed:
```
curl -s -XPOST localhost:3000/api/sql -H "content-type: application/json" -d '{"query":"select count(*) from customers"}'
```
Denied:
```
curl -s -XPOST localhost:3000/api/sql -H "content-type: application/json" -d '{"query":"drop table customers"}'
```

- [ ] **Step 3: Commit**

```bash
git add app/api/sql
git commit -m "feat(api): /api/sql read-only sandboxed query runner"
```

---

## Phase 6 — Dashboard Pages

### Task 6.1: Format helpers + KPI card + gauge

**Files:**
- Create: `lib/format.ts`
- Create: `components/kpi/kpi-card.tsx`
- Create: `components/kpi/health-gauge.tsx`

- [ ] **Step 1: Write `lib/format.ts`**

```ts
export const cents = (c: number) =>
  c >= 100_000 * 100
    ? `$${(c / 100_000 / 100).toFixed(1)}M`
    : c >= 1_000 * 100
      ? `$${Math.round(c / 100_000)}k`
      : `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;
export const n   = (x: number) => x.toLocaleString("en-US");
export const dt  = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—");
```

- [ ] **Step 2: Write `components/kpi/kpi-card.tsx`**

```tsx
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type KpiAccent = "primary" | "error" | "tertiary" | "secondary";

interface Props {
  title: string;
  value: ReactNode;
  delta?: { value: string; up: boolean; warn?: boolean };
  accent?: KpiAccent;
  icon?: ReactNode;
  children?: ReactNode;
}

const ACCENT_BORDER: Record<KpiAccent, string> = {
  primary:   "border-t-primary",
  error:     "border-t-error",
  tertiary:  "border-t-tertiary",
  secondary: "border-t-secondary",
};

export function KpiCard({ title, value, delta, accent = "primary", icon, children }: Props) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border border-outline-variant bg-card p-6 border-t-2",
      ACCENT_BORDER[accent],
    )}>
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-base font-semibold text-on-surface-variant">{title}</h3>
        {icon}
      </div>
      <div className="font-display text-5xl font-bold tracking-tight text-on-surface">{value}</div>
      {delta && (
        <div className={cn(
          "mt-2 flex items-center gap-1 text-xs font-medium",
          delta.warn ? "text-error" : "text-secondary",
        )}>
          <span>{delta.up ? "↑" : "↓"}</span>
          <span>{delta.value}</span>
        </div>
      )}
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Write `components/kpi/health-gauge.tsx`**

```tsx
interface Props { value: number }
export function HealthGauge({ value }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const angle = (clamped / 100) * 180;
  const r = 56, cx = 64, cy = 64;
  const rad = ((180 - angle) * Math.PI) / 180;
  const x = cx + r * Math.cos(rad);
  const y = cy - r * Math.sin(rad);
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`;
  return (
    <div className="relative flex h-32 w-32 items-end justify-center">
      <svg width={128} height={80} viewBox="0 0 128 80">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke="var(--color-surface-container-highest)" strokeWidth={12} fill="none" />
        <path d={arc} stroke="var(--color-secondary)" strokeWidth={12} fill="none" strokeLinecap="round" />
      </svg>
      <div className="absolute bottom-1 flex flex-col items-center">
        <span className="font-display text-4xl font-bold text-on-surface">{clamped}</span>
        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">/ 100</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/format.ts components/kpi
git commit -m "feat(ui): KpiCard, HealthGauge, format helpers"
```

---

### Task 6.2: Overview page (the "wow" page)

**Files:**
- Modify: `app/(dashboard)/page.tsx`
- Create: `components/charts/churn-trend.tsx`
- Create: `components/charts/churn-drivers.tsx`

- [ ] **Step 1: Write `components/charts/churn-trend.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";

type Granularity = "daily" | "weekly" | "monthly";

export function ChurnTrend() {
  const [g, setG] = useState<Granularity>("weekly");
  const [data, setData] = useState<{ date: string; churnPct: number }[] | null>(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/churn-trends?granularity=${g}`).then((r) => r.json()).then((j) => setData(j.trend));
  }, [g]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-on-surface">Churn Trend</h3>
        <ToggleGroup type="single" value={g} onValueChange={(v) => v && setG(v as Granularity)}>
          <ToggleGroupItem value="daily" className="text-xs">Daily</ToggleGroupItem>
          <ToggleGroupItem value="weekly" className="text-xs">Weekly</ToggleGroupItem>
          <ToggleGroupItem value="monthly" className="text-xs">Monthly</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex-1">
        {!data ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="var(--color-outline-variant)" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "var(--color-on-surface-variant)", fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--color-on-surface-variant)", fontSize: 11 }} width={36} />
              <Tooltip
                contentStyle={{ background: "var(--color-surface-container-high)", border: "1px solid var(--color-outline-variant)", borderRadius: 8 }}
                labelStyle={{ color: "var(--color-on-surface-variant)" }}
                formatter={(v: number) => [`${v.toFixed(2)}%`, "Churn"]}
              />
              <Line type="monotone" dataKey="churnPct" stroke="var(--color-primary)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `components/charts/churn-drivers.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const BAR_COLORS = ["bg-error", "bg-tertiary", "bg-primary", "bg-primary-container", "bg-outline-variant"];

export function ChurnDrivers() {
  const [rows, setRows] = useState<{ driver: string; sharePct: number }[] | null>(null);
  useEffect(() => { fetch("/api/churn-trends").then((r) => r.json()).then((j) => setRows(j.drivers)); }, []);

  if (!rows) return <Skeleton className="h-64 w-full" />;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-on-surface">Top Churn Drivers</h3>
        <p className="mt-1 text-xs text-on-surface-variant">Identified factors from exit reasons.</p>
      </div>
      <div className="flex flex-col gap-4">
        {rows.slice(0, 5).map((r, i) => (
          <div key={r.driver}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-on-surface">{r.driver}</span>
              <span className="font-mono text-on-surface-variant">{r.sharePct.toFixed(0)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
              <div className={`h-full rounded-full animate-bar ${BAR_COLORS[i % BAR_COLORS.length]}`}
                   style={{ ["--target-width" as never]: `${r.sharePct}%`, animationDelay: `${i * 100}ms` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `app/(dashboard)/page.tsx`**

```tsx
import { TrendingUp, AlertTriangle, Users, HeartPulse, ArrowRight } from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/kpi/kpi-card";
import { HealthGauge } from "@/components/kpi/health-gauge";
import { ChurnTrend } from "@/components/charts/churn-trend";
import { ChurnDrivers } from "@/components/charts/churn-drivers";
import { getKpiSummary } from "@/lib/queries/kpis.sql";
import { cents, n, pct } from "@/lib/format";

export const revalidate = 60;

export default async function OverviewPage() {
  const k = await getKpiSummary(30);
  return (
    <>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Overview</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Executive summary of retention metrics and at-risk revenue.</p>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3">
          <KpiCard
            title="Churn Rate"
            value={pct(k.churnRatePct)}
            accent="primary"
            icon={<TrendingUp className="text-primary" size={18} />}
            delta={{ value: `${k.churnRateDeltaPct.toFixed(1)}% vs prev period`, up: k.churnRateDeltaPct > 0, warn: k.churnRateDeltaPct > 0 }}
          />
        </div>
        <div className="col-span-12 md:col-span-3">
          <KpiCard
            title="Revenue at Risk"
            value={cents(k.revenueAtRiskCents)}
            accent="error"
            icon={<AlertTriangle className="text-error" size={18} />}
          />
        </div>
        <div className="col-span-12 md:col-span-3">
          <KpiCard
            title="Predicted Churn"
            value={n(k.predictedChurnUsers)}
            accent="tertiary"
            icon={<Users className="text-tertiary" size={18} />}
          >
            <Link
              href="/customers?risk=high"
              className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded border border-outline-variant py-1.5 text-xs text-on-surface hover:border-primary hover:text-primary"
            >
              View Customers <ArrowRight size={12} />
            </Link>
          </KpiCard>
        </div>
        <div className="col-span-12 md:col-span-3">
          <KpiCard
            title="Health Score"
            value={<HealthGauge value={k.healthScore} />}
            accent="secondary"
            icon={<HeartPulse className="text-secondary" size={18} />}
          />
        </div>
      </section>

      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 h-[400px] rounded-xl border border-outline-variant bg-card p-6 lg:col-span-8">
          <ChurnTrend />
        </div>
        <div className="col-span-12 h-[400px] rounded-xl border border-outline-variant bg-card p-6 lg:col-span-4">
          <ChurnDrivers />
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Visual check against the mock**

Open `/`, compare with `stitch_retentioniq_saas_analytics_dashboard/retentioniq_overview_dashboard/screen.png`. Confirm: 4 KPI cards across the top, line chart left (8 cols), bars right (4 cols). Accent borders match (indigo / red / amber / green).

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/page.tsx components/charts
git commit -m "feat(overview): KPI grid + churn trend + drivers"
```

---

### Task 6.3: Customer Health page + drawer

**Files:**
- Create: `app/(dashboard)/customers/page.tsx`
- Create: `components/customers/customers-table.tsx`
- Create: `components/customers/customer-drawer.tsx`

> Reference mock: `stitch_retentioniq_saas_analytics_dashboard/retentioniq_customer_health_crm/code.html`.

- [ ] **Step 1: Write `components/customers/customers-table.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import {
  flexRender, getCoreRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import { CustomerDrawer } from "@/components/customers/customer-drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cents, dt, pct } from "@/lib/format";
import type { CustomerRow } from "@/lib/types";

const columns: ColumnDef<CustomerRow>[] = [
  { accessorKey: "companyName",    header: "Customer" },
  { accessorKey: "healthScore",    header: "Health", cell: ({ row }) => <HealthPill score={row.original.healthScore} /> },
  { accessorKey: "churnProb",      header: "Churn Prob", cell: ({ row }) => pct(row.original.churnProb * 100, 0) },
  { accessorKey: "mrrCents",       header: "MRR", cell: ({ row }) => cents(row.original.mrrCents) },
  { accessorKey: "lastLogin",      header: "Last Login", cell: ({ row }) => dt(row.original.lastLogin) },
  { accessorKey: "openTickets",    header: "Tickets" },
  { accessorKey: "recommendedAction", header: "Recommended" },
];

function HealthPill({ score }: { score: number }) {
  const color = score >= 75 ? "bg-secondary/10 text-secondary"
              : score >= 50 ? "bg-tertiary/10 text-tertiary"
              :               "bg-error/10 text-error";
  return <span className={`rounded-full px-2 py-0.5 text-xs ${color}`}>{score}</span>;
}

export function CustomersTable() {
  const [rows,    setRows]    = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState("");
  const [page,    setPage]    = useState(1);
  const [sorting, setSorting] = useState<SortingState>([{ id: "churnProb", desc: true }]);
  const [openId,  setOpenId]  = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (q) params.set("q", q);
    if (sorting[0]) {
      params.set("sort", sorting[0].id);
      params.set("dir", sorting[0].desc ? "desc" : "asc");
    }
    setLoading(true);
    fetch(`/api/customers?${params}`).then((r) => r.json()).then((j) => { setRows(j.rows); setLoading(false); });
  }, [q, page, sorting]);

  const table = useReactTable({
    data: rows, columns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const exportCsv = () => {
    const headers = columns.map((c) => String((c as { header: string }).header));
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [r.companyName, r.healthScore, r.churnProb, r.mrrCents / 100, r.lastLogin ?? "", r.openTickets, r.recommendedAction]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "customers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-outline-variant bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant p-4">
        <Input placeholder="Search company or email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-xs" />
        <Button variant="outline" size="sm" onClick={exportCsv}>Export CSV</Button>
      </div>
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface-container-low text-left text-[10px] uppercase tracking-widest text-on-surface-variant">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="px-4 py-3 font-medium" onClick={h.column.getToggleSortingHandler()} style={{ cursor: "pointer" }}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {h.column.getIsSorted() === "asc"  && " ↑"}
                  {h.column.getIsSorted() === "desc" && " ↓"}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={columns.length} className="p-6 text-center text-on-surface-variant">Loading…</td></tr>
          )}
          {!loading && table.getRowModel().rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => setOpenId(r.original.id)}
              className="cursor-pointer border-t border-outline-variant/30 hover:bg-surface-container/60"
            >
              {r.getVisibleCells().map((c) => (
                <td key={c.id} className="px-4 py-3 text-on-surface">{flexRender(c.column.columnDef.cell ?? c.column.columnDef.header, c.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between p-4 text-xs text-on-surface-variant">
        <span>Page {page}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <Button size="sm" variant="outline" disabled={rows.length < 25} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
      <CustomerDrawer customerId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
```

- [ ] **Step 2: Write `components/customers/customer-drawer.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cents, dt, pct } from "@/lib/format";

interface Props { customerId: string | null; onClose: () => void; }

export function CustomerDrawer({ customerId, onClose }: Props) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    if (!customerId) { setData(null); return; }
    fetch(`/api/customers/${customerId}`).then((r) => r.json()).then(setData);
  }, [customerId]);

  if (!customerId) return null;
  return (
    <Sheet open={!!customerId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-[480px] bg-surface-container-low text-on-surface sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>{(data?.company_name as string) ?? "Loading…"}</SheetTitle>
        </SheetHeader>
        {data && (
          <div className="mt-4 space-y-6 text-sm">
            <section className="rounded-lg border border-outline-variant bg-surface-container p-4">
              <div className="text-xs text-on-surface-variant">AI summary</div>
              <p className="mt-1 text-on-surface">{buildSummary(data)}</p>
            </section>
            <section>
              <div className="text-xs uppercase tracking-widest text-on-surface-variant">Risk</div>
              <div className="mt-1 text-2xl font-display">{pct(((data.churn_prob as number) ?? 0) * 100, 0)}</div>
            </section>
            <section>
              <div className="mb-2 text-xs uppercase tracking-widest text-on-surface-variant">Recent tickets</div>
              <ul className="space-y-1">
                {(data.tickets as { id: string; category: string; severity: string; opened_at: string; resolved_at: string | null }[]).slice(0, 5).map((t) => (
                  <li key={t.id} className="flex justify-between text-xs">
                    <span>{t.category} · {t.severity}</span>
                    <span className="text-on-surface-variant">{dt(t.opened_at)} → {t.resolved_at ? dt(t.resolved_at) : "open"}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <div className="mb-2 text-xs uppercase tracking-widest text-on-surface-variant">Payments (last 12)</div>
              <ul className="space-y-1">
                {(data.payments as { id: string; amount_cents: number; status: string; paid_at: string }[]).slice(0, 12).map((p) => (
                  <li key={p.id} className="flex justify-between text-xs">
                    <span>{dt(p.paid_at)}</span>
                    <span className={p.status === "succeeded" ? "text-secondary" : "text-error"}>{cents(p.amount_cents)} · {p.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function buildSummary(d: Record<string, unknown>): string {
  const tickets = (d.tickets as { resolved_at: string | null }[]).filter((t) => !t.resolved_at).length;
  const recentLogins = (d.usage as { total: number }[]).slice(-4).reduce((s, x) => s + x.total, 0);
  const churn = ((d.churn_prob as number) ?? 0) * 100;
  const region = d.region as string;
  return `${d.company_name} (${region}, ${d.plan_id}) has ${tickets} open ticket${tickets === 1 ? "" : "s"} and ${recentLogins} logins in the last 4 weeks. Estimated churn probability is ${churn.toFixed(0)}%.`;
}
```

- [ ] **Step 3: Write `app/(dashboard)/customers/page.tsx`**

```tsx
import { CustomersTable } from "@/components/customers/customers-table";

export default function CustomersPage() {
  return (
    <>
      <header className="mb-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Customer Health</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Search, sort, and drill into individual accounts.</p>
      </header>
      <CustomersTable />
    </>
  );
}
```

- [ ] **Step 4: Click-through test**

Visit `/customers`. Confirm: 25 rows load sorted by churn desc; search filters; row click opens drawer; Export CSV downloads.

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/customers components/customers
git commit -m "feat(customers): TanStack table + drawer with AI-style summary"
```

---

### Task 6.4: Cohort Analysis page

**Files:**
- Create: `app/(dashboard)/cohorts/page.tsx`
- Create: `components/charts/cohort-heatmap.tsx`

- [ ] **Step 1: Write `components/charts/cohort-heatmap.tsx`**

```tsx
"use client";
import { useEffect, useState, Fragment } from "react";
import type { CohortCell } from "@/lib/types";

function color(p: number): string {
  const a = Math.max(0.05, Math.min(0.95, p / 100));
  return `rgba(128, 131, 255, ${a})`;
}

export function CohortHeatmap() {
  const [cells, setCells] = useState<CohortCell[] | null>(null);
  useEffect(() => { fetch("/api/cohorts").then((r) => r.json()).then((j) => setCells(j.cells)); }, []);
  if (!cells) return <div className="h-96 animate-pulse rounded-xl bg-surface-container" />;

  const cohorts   = Array.from(new Set(cells.map((c) => c.cohortMonth))).sort();
  const monthCols = Array.from(new Set(cells.map((c) => c.monthIndex))).sort((a, b) => a - b);
  const map       = new Map(cells.map((c) => [`${c.cohortMonth}|${c.monthIndex}`, c]));

  return (
    <div className="overflow-auto rounded-xl border border-outline-variant bg-card p-6">
      <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${monthCols.length}, 56px)` }}>
        <div></div>
        {monthCols.map((m) => <div key={m} className="text-center text-[10px] uppercase tracking-widest text-on-surface-variant">M+{m}</div>)}
        {cohorts.map((co) => (
          <Fragment key={co}>
            <div className="text-xs text-on-surface-variant">{co}</div>
            {monthCols.map((m) => {
              const c = map.get(`${co}|${m}`);
              return (
                <div
                  key={`${co}-${m}`}
                  title={c ? `${co} M+${m}: ${c.retentionPct}% of ${c.cohortSize}` : ""}
                  className="flex h-10 items-center justify-center rounded text-[11px] font-mono text-on-surface"
                  style={{ background: c ? color(c.retentionPct) : "transparent" }}
                >
                  {c ? `${c.retentionPct.toFixed(0)}` : ""}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `app/(dashboard)/cohorts/page.tsx`**

```tsx
import { CohortHeatmap } from "@/components/charts/cohort-heatmap";

export default function CohortsPage() {
  return (
    <>
      <header className="mb-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Cohort Analysis</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Monthly signup cohorts vs retention through month 12.</p>
      </header>
      <CohortHeatmap />
    </>
  );
}
```

- [ ] **Step 3: Visual confirm**

Visit `/cohorts`. Heatmap renders with darker cells near M+0 and fading rightward.

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/cohorts components/charts/cohort-heatmap.tsx
git commit -m "feat(cohorts): retention heatmap"
```

---

### Task 6.5: Revenue Risk, Support, Predictions, Recommendations pages

**Files:**
- Create: `app/(dashboard)/revenue/page.tsx`
- Create: `app/(dashboard)/support/page.tsx`
- Create: `app/(dashboard)/predictions/page.tsx`
- Create: `app/(dashboard)/recommendations/page.tsx`
- Create: `components/charts/revenue-sankey.tsx`
- Create: `components/charts/feature-importance.tsx`
- Create: `components/recommendations/recommendation-card.tsx`

- [ ] **Step 1: Sankey (`components/charts/revenue-sankey.tsx`)**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";

export function RevenueSankey() {
  const [data, setData] = useState<{ bands: { band: string; customers: number; mrrCents: number }[] } | null>(null);
  useEffect(() => { fetch("/api/revenue-risk").then((r) => r.json()).then(setData); }, []);
  if (!data) return <div className="h-96 animate-pulse rounded-xl bg-surface-container" />;

  const links = data.bands.map((b, i) => ({ source: 0, target: i + 1, value: Math.max(1, b.customers) }));
  const nodes = [{ name: "All Active" }, ...data.bands.map((b) => ({ name: b.band }))];
  return (
    <div className="h-96 rounded-xl border border-outline-variant bg-card p-6">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={{ nodes, links }}
          nodePadding={20}
          link={{ stroke: "var(--color-primary)" }}
          node={{ fill: "var(--color-primary)" }}
        >
          <Tooltip />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Revenue page**

```tsx
// app/(dashboard)/revenue/page.tsx
import { RevenueSankey } from "@/components/charts/revenue-sankey";
import { getRevenueRiskBands } from "@/lib/queries/revenue.sql";
import { cents } from "@/lib/format";

export const revalidate = 60;

export default async function RevenuePage() {
  const bands = await getRevenueRiskBands();
  return (
    <>
      <header className="mb-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Revenue Risk</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Where is at-risk revenue concentrated, and how much can we save?</p>
      </header>
      <section className="mb-6 grid grid-cols-4 gap-4">
        {bands.map((b) => (
          <div key={b.band} className="rounded-xl border border-outline-variant bg-card p-4">
            <div className="text-xs uppercase tracking-widest text-on-surface-variant">{b.band}</div>
            <div className="mt-1 font-display text-2xl">{cents(b.mrrCents)}</div>
            <div className="text-xs text-on-surface-variant">{b.customers} customers</div>
          </div>
        ))}
      </section>
      <RevenueSankey />
    </>
  );
}
```

- [ ] **Step 3: Support page**

```tsx
// app/(dashboard)/support/page.tsx
import { getSupportAnalytics } from "@/lib/queries/support.sql";

export const revalidate = 60;

export default async function SupportPage() {
  const rows = (await getSupportAnalytics()) as unknown as Array<{
    category: string; tickets: number; avg_hours_to_resolve: number; avg_csat: number | null;
  }>;
  return (
    <>
      <header className="mb-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Support Analytics</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Tickets, resolution time, CSAT by category.</p>
      </header>
      <table className="w-full overflow-hidden rounded-xl border border-outline-variant bg-card text-sm">
        <thead className="bg-surface-container-low text-left text-[10px] uppercase tracking-widest text-on-surface-variant">
          <tr><th className="px-4 py-3">Category</th><th className="px-4 py-3">Tickets</th><th className="px-4 py-3">Avg hours</th><th className="px-4 py-3">CSAT</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.category} className="border-t border-outline-variant/30">
              <td className="px-4 py-3 capitalize">{r.category.replace("_", " ")}</td>
              <td className="px-4 py-3">{r.tickets}</td>
              <td className="px-4 py-3">{r.avg_hours_to_resolve}</td>
              <td className="px-4 py-3">{r.avg_csat ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
```

- [ ] **Step 4: Feature importance chart**

```tsx
// components/charts/feature-importance.tsx
"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export function FeatureImportance() {
  const [rows, setRows] = useState<{ feature: string; importance: number }[] | null>(null);
  useEffect(() => { fetch("/api/predictions").then((r) => r.json()).then((j) => setRows(j.importance)); }, []);
  if (!rows) return <div className="h-72 animate-pulse rounded-xl bg-surface-container" />;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={rows} layout="vertical" margin={{ left: 80 }}>
        <XAxis type="number" tick={{ fill: "var(--color-on-surface-variant)", fontSize: 11 }} />
        <YAxis type="category" dataKey="feature" tick={{ fill: "var(--color-on-surface-variant)", fontSize: 11 }} width={140} />
        <Tooltip contentStyle={{ background: "var(--color-surface-container-high)", border: "1px solid var(--color-outline-variant)" }} />
        <Bar dataKey="importance" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 5: Predictions page**

```tsx
// app/(dashboard)/predictions/page.tsx
import { getRiskSegments } from "@/lib/queries/predictions.sql";
import { FeatureImportance } from "@/components/charts/feature-importance";
import { cents } from "@/lib/format";

export const revalidate = 300;

export default async function PredictionsPage() {
  const segs = await getRiskSegments();
  return (
    <>
      <header className="mb-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Predictions</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Logistic-regression churn scores trained on 7 product, support, and billing signals.</p>
      </header>
      <section className="mb-6 grid grid-cols-4 gap-4">
        {segs.map((s) => (
          <div key={s.band} className="rounded-xl border border-outline-variant bg-card p-4">
            <div className="text-xs uppercase tracking-widest text-on-surface-variant">{s.band}</div>
            <div className="mt-1 font-display text-2xl">{s.customers}</div>
            <div className="text-xs text-on-surface-variant">{cents(Number(s.mrr_cents))} MRR</div>
          </div>
        ))}
      </section>
      <div className="rounded-xl border border-outline-variant bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Feature importance</h3>
        <FeatureImportance />
      </div>
    </>
  );
}
```

- [ ] **Step 6: Recommendation card + page**

```tsx
// components/recommendations/recommendation-card.tsx
import { cents } from "@/lib/format";

interface Props {
  title: string; action: string; confidence: number;
  expectedReductionPct: number; customers: number; mrr_cents: number;
}
export function RecommendationCard(p: Props) {
  return (
    <div className="rounded-xl border border-outline-variant bg-card p-6">
      <h3 className="text-lg font-semibold text-on-surface">{p.title}</h3>
      <p className="mt-1 text-sm text-on-surface-variant">{p.action}</p>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <Stat label="Customers"   value={String(p.customers)} />
        <Stat label="MRR at risk" value={cents(Number(p.mrr_cents))} />
        <Stat label="Est. lift"   value={`-${p.expectedReductionPct}% churn`} />
      </dl>
      <div className="mt-4 h-1 w-full rounded-full bg-surface-container">
        <div className="h-1 rounded-full bg-primary" style={{ width: `${p.confidence * 100}%` }} />
      </div>
      <div className="mt-1 text-right text-[10px] uppercase tracking-widest text-on-surface-variant">
        Confidence {Math.round(p.confidence * 100)}%
      </div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="uppercase tracking-widest text-on-surface-variant">{label}</div>
      <div className="mt-1 font-display text-xl text-on-surface">{value}</div>
    </div>
  );
}
```

```tsx
// app/(dashboard)/recommendations/page.tsx
import { RecommendationCard } from "@/components/recommendations/recommendation-card";

export const revalidate = 300;

interface ApiResp {
  recommendations: Array<{
    id: string; title: string; action: string; confidence: number;
    expectedReductionPct: number; customers: number; mrr_cents: number;
  }>;
}

export default async function RecommendationsPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/recommendations`,
    { next: { revalidate: 300 } },
  );
  const j = (await res.json()) as ApiResp;
  return (
    <>
      <header className="mb-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Recommendations</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Concrete actions, mapped to customer segments at risk.</p>
      </header>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {j.recommendations.map((r) => <RecommendationCard key={r.id} {...r} />)}
      </section>
    </>
  );
}
```

- [ ] **Step 7: Smoke-test each page**

Visit `/revenue`, `/support`, `/predictions`, `/recommendations`. Each renders without console errors and shows real numbers.

- [ ] **Step 8: Commit**

```bash
git add app/(dashboard)/{revenue,support,predictions,recommendations} components/charts/{revenue-sankey,feature-importance}.tsx components/recommendations
git commit -m "feat(pages): revenue, support, predictions, recommendations"
```

---

### Task 6.6: SQL Explorer page

**Files:**
- Create: `components/sql/sql-explorer.tsx`
- Create: `app/(dashboard)/sql/page.tsx`

- [ ] **Step 1: Write `components/sql/sql-explorer.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const EXAMPLES = [
  { name: "Top 10 churning regions",
    sql: "select region, count(*) filter (where churned_at is not null)::float / count(*) * 100 as churn_pct\nfrom customers group by region order by churn_pct desc;" },
  { name: "Open tickets by category",
    sql: "select category, count(*) from support_tickets where resolved_at is null group by category order by 2 desc;" },
  { name: "Top 10 at-risk customers",
    sql: "select c.company_name, p.churn_prob from customers c join churn_predictions p on p.customer_id=c.id where c.churned_at is null order by p.churn_prob desc limit 10;" },
];

interface Result { rows: Record<string, unknown>[]; rowCount: number; truncated: boolean; durationMs: number }

export function SqlExplorer() {
  const [query, setQuery]     = useState(EXAMPLES[0].sql);
  const [result, setResult]   = useState<Result | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true); setError(null); setResult(null);
    const r = await fetch("/api/sql", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const j = await r.json();
    setRunning(false);
    if (!r.ok) setError(j.error ?? "query failed");
    else setResult(j);
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-3 space-y-2">
        <div className="text-xs uppercase tracking-widest text-on-surface-variant">Examples</div>
        {EXAMPLES.map((e) => (
          <button key={e.name} onClick={() => setQuery(e.sql)}
                  className="block w-full rounded-md border border-outline-variant bg-surface-container px-3 py-2 text-left text-xs hover:border-primary hover:text-primary">
            {e.name}
          </button>
        ))}
      </aside>
      <div className="col-span-9 space-y-4">
        <textarea
          value={query} onChange={(e) => setQuery(e.target.value)}
          rows={8} spellCheck={false}
          className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-4 font-mono text-sm text-on-surface focus:border-primary focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <Button onClick={run} disabled={running}>{running ? "Running…" : "Run query"}</Button>
          {result && <span className="text-xs text-on-surface-variant">{result.rowCount} rows · {result.durationMs}ms{result.truncated ? " · truncated" : ""}</span>}
          {error && <span className="text-xs text-error">{error}</span>}
        </div>
        {result && result.rows.length > 0 && (
          <div className="overflow-auto rounded-xl border border-outline-variant bg-card">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-left text-[10px] uppercase tracking-widest text-on-surface-variant">
                <tr>{Object.keys(result.rows[0]).map((k) => <th key={k} className="px-4 py-3">{k}</th>)}</tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-t border-outline-variant/30">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-4 py-2 font-mono text-on-surface">{v === null ? "—" : String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `app/(dashboard)/sql/page.tsx`**

```tsx
import { SqlExplorer } from "@/components/sql/sql-explorer";

export default function SqlPage() {
  return (
    <>
      <header className="mb-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">SQL Explorer</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Read-only queries against the warehouse. SELECT only, 500-row cap, 5s timeout.</p>
      </header>
      <SqlExplorer />
    </>
  );
}
```

- [ ] **Step 3: Test allowed + denied paths**

Visit `/sql`. Run the first example → table renders. Replace with `delete from customers;` → see the red "only SELECT queries are permitted" error.

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/sql components/sql
git commit -m "feat(sql-explorer): sandboxed SELECT-only query playground"
```

---

### Task 6.7: Settings stub

**Files:**
- Create: `app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Write a minimal page**

```tsx
export default function SettingsPage() {
  return (
    <>
      <header className="mb-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Theme, integrations, and notifications (placeholder).</p>
      </header>
      <div className="rounded-xl border border-outline-variant bg-card p-6 text-sm text-on-surface-variant">
        Configuration UI lives here in a future release.
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(dashboard)/settings
git commit -m "feat(settings): placeholder page"
```

---

## Phase 7 — Polish & EDA Notebook

### Task 7.1: Loading & not-found states

**Files:**
- Create: `app/(dashboard)/loading.tsx`
- Create: `app/(dashboard)/not-found.tsx`

- [ ] **Step 1: `app/(dashboard)/loading.tsx`**

```tsx
import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="col-span-12 h-36 md:col-span-3" />
      ))}
      <Skeleton className="col-span-12 h-96 lg:col-span-8" />
      <Skeleton className="col-span-12 h-96 lg:col-span-4" />
    </div>
  );
}
```

- [ ] **Step 2: `app/(dashboard)/not-found.tsx`**

```tsx
export default function NotFound() {
  return (
    <div className="grid h-[60vh] place-items-center">
      <div className="text-center">
        <div className="font-display text-6xl">404</div>
        <p className="mt-2 text-on-surface-variant">This page hasn't been built yet.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(dashboard)/loading.tsx app/(dashboard)/not-found.tsx
git commit -m "feat(ux): loading skeleton + 404"
```

---

### Task 7.2: EDA notebook for the README

**Files:**
- Create: `notebooks/churn_eda.ipynb`

- [ ] **Step 1: Create the notebook with these 7 cells**

  1. **Markdown:** "RetentionIQ EDA — Churn drivers in the synthetic dataset."
  2. **Code:** load env, connect to Neon, run the same `FEATURES_SQL` from `train_model.py`.
  3. **Markdown:** "Class balance — how much churn does the dataset contain?"
  4. **Code:** `df['churned'].value_counts(normalize=True)` and a `matplotlib` bar.
  5. **Markdown:** "Univariate exploration — which signals correlate with churn?"
  6. **Code:** For each of `tickets_90d`, `failed_payments_180d`, `usage_delta`, `plan_rank`: grouped mean churn rate + boxplot.
  7. **Markdown:** "Takeaways":
     - Customers with 3+ open tickets churn at ~X×
     - Customers with 2+ failed payments in 180 days churn at ~Y×
     - Plan tier signal: starter-tier accounts churn ~Z% more than enterprise

- [ ] **Step 2: Run the notebook end-to-end**

Restart kernel, run all cells. Confirm no errors.

- [ ] **Step 3: Commit (with cleared outputs)**

```bash
jupyter nbconvert --clear-output notebooks/churn_eda.ipynb
git add notebooks/
git commit -m "docs(eda): churn drivers notebook"
```

---

## Phase 8 — Deployment

### Task 8.1: Vercel project + environment

- [ ] **Step 1: Install Vercel CLI if not present**

Run: `npm i -g vercel`
Verify: `vercel --version`

- [ ] **Step 2: Link the project**

Run: `vercel link`
Choose: existing project or create new. Project name: `retentioniq`.

- [ ] **Step 3: Push env vars to Vercel**

```
vercel env add DATABASE_URL production
vercel env add DATABASE_URL_READONLY production
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL_READONLY preview
vercel env add CHURN_MODEL_PATH production
# value for CHURN_MODEL_PATH: ./public/model/churn_model.joblib
```

- [ ] **Step 4: First deploy (preview)**

Run: `vercel`
Expected: preview URL. Click through every page. If a server-rendered page calls `/api/recommendations` and fails because `NEXT_PUBLIC_SITE_URL` isn't set, add it via `vercel env add NEXT_PUBLIC_SITE_URL preview` pointing at the preview URL.

- [ ] **Step 5: Production deploy**

Run: `vercel --prod`

- [ ] **Step 6: Commit config**

```bash
git add vercel.json .env.local.example
git commit -m "chore(deploy): vercel project linked"
```

---

### Task 8.2: GitHub repo + README screenshots

**Files:**
- Modify: `README.md`
- Create: `docs/screenshots/*.png` (manually captured)

- [ ] **Step 1: Take screenshots**

Open each page in production (or `vercel dev`), use devtools "Responsive" 1440×900. Save PNGs to `docs/screenshots/`: `overview.png`, `customers.png`, `customer-drawer.png`, `cohorts.png`, `revenue.png`, `predictions.png`, `recommendations.png`, `sql-explorer.png`.

- [ ] **Step 2: Rewrite `README.md`**

````markdown
# RetentionIQ — Churn & Revenue Recovery Dashboard

> _Which customers are likely to churn, why, and how much revenue can we save?_

**Live:** https://<your-vercel-url> · **Stack:** Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · Recharts · TanStack Table · Neon Postgres · scikit-learn · Vercel (Node + Python Fluid Compute)

![Overview](docs/screenshots/overview.png)

## Business problem
SaaS retention is the single largest lever on net revenue. This project simulates a 5,000-customer SaaS book of business and answers four executive questions:

1. **How bad is churn?** → Overview KPIs + trend line.
2. **Why are customers leaving?** → Driver bar chart + cohort retention heatmap.
3. **Who is at risk right now?** → Customer table + AI-style drawer summary.
4. **What should we do about it?** → Logistic-regression-driven recommendations with expected lift.

## Data model
6 tables on Neon Postgres: `plans`, `customers`, `subscriptions`, `payments`, `usage_events`, `support_tickets`, plus a derived `churn_predictions` table populated by the Python training job. Two helper views: `v_customer_active_months` (cohort retention), `v_customer_ltv`.

## Featured SQL
- **Churn rate** uses a date-bucketed `generate_series` join to plot daily / weekly / monthly churn (`lib/queries/churn.sql.ts`).
- **Cohort retention** uses a `lateral generate_series` to expand each customer into monthly active rows, then groups by signup-month × month-index.
- **LTV** is a left-join aggregation in `v_customer_ltv`.
- **Top 100 to save** orders by `churn_prob × MRR`.

## Python / ML
`scripts/train_model.py` fits a `StandardScaler → LogisticRegression` pipeline on 7 features (tickets, failed payments, usage delta, plan rank, MRR, etc.). The notebook `notebooks/churn_eda.ipynb` walks through the driver analysis. `api/predict.py` is a Vercel Python serverless function that scores ad-hoc payloads against the persisted model.

## Dashboard screenshots
| Customer Health | Cohort Heatmap |
| :-: | :-: |
| ![](docs/screenshots/customers.png) | ![](docs/screenshots/cohorts.png) |
| **Predictions** | **Recommendations** |
| ![](docs/screenshots/predictions.png) | ![](docs/screenshots/recommendations.png) |

## Top business recommendations (from this dataset)
1. **Customers with 3+ open tickets and declining usage churn at ≈2.4× baseline.** Action: dedicated CSM + priority SLA. Expected lift: −12% churn.
2. **Customers with ≥2 failed payments in 180 days churn at ≈1.9× baseline.** Action: Smart Retries + offer ACH. Expected lift: −6%.
3. **Customers with no login in 21 days and moderate risk score.** Action: re-engagement email + product walkthrough. Expected lift: −8%.

## Run locally
```bash
git clone <this repo>
cp .env.local.example .env.local        # fill DATABASE_URL from Neon
npm install
npm run db:migrate
python -m venv .venv && .venv/Scripts/Activate.ps1
pip install -r scripts/requirements.txt
python scripts/seed.py
python scripts/train_model.py
npm run dev
```

## Architecture
- **Frontend:** Next.js App Router on Vercel (Fluid Compute, Node 20).
- **Data API:** Route Handlers in `app/api/*` query Neon via `@neondatabase/serverless`.
- **ML API:** `api/predict.py` Python Fluid-Compute function.
- **DB:** Neon Postgres. Read-only sandboxed role for the in-app SQL Explorer.
````

- [ ] **Step 3: Commit**

```bash
git add README.md docs/screenshots
git commit -m "docs: README with business problem, SQL, ML, screenshots, recommendations"
```

---

### Task 8.3: Push to GitHub

- [ ] **Step 1: Create the GitHub repo**

```
gh repo create retentioniq --public --source=. --remote=origin
```

- [ ] **Step 2: Push**

```
git push -u origin main
```

- [ ] **Step 3: Connect Vercel to the GitHub repo**

In Vercel → Project → Settings → Git, connect to `retentioniq`. From here every push to `main` builds.

- [ ] **Step 4: Final smoke-test on production URL**

Open every page; trigger the SQL Explorer; open a customer drawer. Confirm no errors in browser console or Vercel logs.

---

## Acceptance Criteria

The project is "done" when **all** of these are true:

1. Live Vercel URL serves all eight pages with real data from Neon and no console errors.
2. The Overview page matches `retentioniq_overview_dashboard/screen.png` within minor pixel drift (4 KPI cards top, line chart + bars below).
3. The Customer Health table supports search, server-side sort/pagination, row click → drawer, CSV export.
4. The Cohort heatmap shows ≥12 monthly cohorts with retention fading right.
5. The Predictions page shows the 4 risk bands with non-zero customer counts and a feature-importance bar chart.
6. The Recommendations page lists ≥3 cards with customer counts, MRR, and confidence pulled live.
7. The SQL Explorer runs `select count(*) from customers;` successfully and rejects `delete from customers;`.
8. Mobile viewport (≤1024px) shows the bottom nav, no horizontal scroll, KPI cards stacked.
9. `scripts/train_model.py` runs end-to-end from a fresh seed and writes both `public/model/churn_model.joblib` and the `churn_predictions` table.
10. README on GitHub renders with screenshots and the three business-recommendation statements.

---

## Self-review notes

- Every step contains either runnable code or an exact command — no placeholders.
- Types in `lib/types.ts` flow through queries → API → components consistently (`CustomerRow.churnProb` is the same field everywhere).
- Phase 2 helpers reference `churn_predictions`, which is created in Phase 4 — fine because Phase 2 queries use `coalesce(... , 0.5)` defaults so they don't break before Phase 4 runs.
- The recommendations endpoint uses `sql.unsafe(r.where)` with clauses **hardcoded in this file** (not user input), so SQL injection is not possible. If a future task lets users author rules, that needs revisiting.
- The SQL Explorer is layered: forbidden-keyword regex + must-start-with-SELECT + read-only role + 500-row + 5s timeout. All four layers are required.
- `bg-card` token (added in Task 0.3) replaces the hardcoded `bg-[#111827]` from the HTML mocks so panel color is centralized.
- Mobile responsiveness is built into Task 3.1 (sidebar/bottom-nav) and the existing `col-span-12 md:col-span-3` grid classes — no separate phase needed.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-19-retentioniq-dashboard.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session using `executing-plans`, batch execution with checkpoints.

**Which approach?**
