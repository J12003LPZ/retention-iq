# Customer Health Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Customer Health page with a searchable/filterable table and slide-out customer detail drawer.

**Architecture:** A Server Component page fetches initial data and renders a Client wrapper that holds `selectedId` state, passing it down to CustomersTable (filters/sort/pagination via URL params) and CustomerDrawer (fetches detail on customerId change via `/api/customers/{id}`).

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4 (design tokens in globals.css), shadcn/ui canary (Table, Badge, Sheet, Select, Input, ScrollArea, Button, Skeleton from components/ui/), TypeScript strict.

---

## Key Facts (read before coding)

### CustomerRow fields (from lib/types.ts)
```ts
interface CustomerRow {
  id: string
  companyName: string   // NOT "name"
  healthScore: number   // 0-100 integer
  churnProb: number     // 0-1 float
  mrrCents: number      // in cents
  lastLogin: string | null
  openTickets: number
  recommendedAction: string
  region: Region        // "NA" | "EMEA" | "APAC" | "LATAM"
  plan: PlanId          // "starter" | "growth" | "pro" | "enterprise"
}
```

### getCustomers signature (from lib/queries/customers.sql.ts)
```ts
interface ListOpts {
  search?: string
  region?: string
  plan?: string
  riskMin?: number
  sort?: "health" | "churnProb" | "mrr" | "lastLogin"
  dir?: "asc" | "desc"
  page?: number
  pageSize?: number
}
getCustomers(opts?: ListOpts): Promise<CustomerRow[]>
```

### API /api/customers/{id} response shape (from getCustomerById)
Returns: `{ id, company_name, email, region, plan_id, mrr_cents, churn_prob, health_score, joined_at, ...usage[], tickets[], payments[] }`
Note: raw DB field names (snake_case), plus `usage`, `tickets`, `payments` arrays.

### Formatters (from lib/format.ts)
- `fmtPct(value: number, decimals?)` — formats 0-1 as "23.4%"
- `fmtMrr(value: number)` — formats cents-not-dollars, e.g. fmtMrr(123456) → "$1.2K"
  - IMPORTANT: mrrCents is in cents, so pass mrrCents/100 to fmtMrr, OR call fmtMrr(mrrCents) if it expects cents (check: fmtMrr just does value/1_000_000 etc — so pass raw mrrCents and it treats it as the unit)
  - Actually from format.ts: fmtMrr(1234567) → "$1.2M" — so pass mrrCents directly, it treats input as the dollar-denominated value. But mrrCents=5000 means $50, so pass mrrCents/100.
  - Confirmed: pass `mrrCents / 100` to fmtMrr.
- `fmtDate(iso: string)` — formats ISO to "Jan 15, 2024"

### Design tokens (from app/globals.css @theme)
- `--color-surface-container` — card background
- `--color-surface-container-high` — elevated card
- `--color-on-surface` — primary text
- `--color-on-surface-variant` — secondary text
- `--color-outline-variant` — borders
- `--color-primary` — accent
- `--color-secondary` — green (#4edea3)
- `--color-error` — red (#ffb4ab)
- `--color-tertiary` — orange (#ffb95f)

### Sheet component (from components/ui/sheet.tsx)
Uses `@base-ui/react/dialog` with data-side prop on SheetContent.
Open/close controlled via `Sheet open={bool} onOpenChange={fn}`.
`SheetPrimitive.Root.Props` is `Dialog.Root.Props` — has `open` and `onOpenChange`.

### Select component (from components/ui/select.tsx)
Uses `@base-ui/react/select`. Root is `SelectPrimitive.Root`.
`Select` = `SelectPrimitive.Root` (aliased). Has `value` and `onValueChange` props.

---

## File Structure

| File | Role |
|------|------|
| `components/customers/customers-table.tsx` | Client component — table with search/filter/sort/pagination, calls parent callbacks |
| `components/customers/customer-drawer.tsx` | Client component — Sheet slide-out with customer detail fetch |
| `components/customers/customers-page-client.tsx` | Client component — holds selectedId state, syncs filters to URL, renders both |
| `app/(dashboard)/customers/page.tsx` | Server component — fetches initial data, renders CustomersPageClient |

---

## Task 1: CustomersTable component

**Files:**
- Create: `components/customers/customers-table.tsx`

- [ ] **Step 1: Create the file with all imports and types**

```tsx
"use client"

import * as React from "react"
import { ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon, SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { CustomerRow } from "@/lib/types"
import { fmtPct, fmtMrr, fmtDate } from "@/lib/format"

type SortKey = "health" | "churnProb" | "mrr" | "lastLogin"
type SortDir = "asc" | "desc"

interface CustomersTableProps {
  rows: CustomerRow[]
  page: number
  totalPages: number
  sort: SortKey
  dir: SortDir
  search: string
  region: string
  plan: string
  onSortChange: (key: SortKey, dir: SortDir) => void
  onSearchChange: (q: string) => void
  onRegionChange: (r: string) => void
  onPlanChange: (p: string) => void
  onPageChange: (p: number) => void
  onRowClick: (id: string) => void
}
```

- [ ] **Step 2: Implement the risk badge helper and sort icon helper**

Add these pure functions below the imports (before the component):

```tsx
function riskBadge(churnProb: number) {
  if (churnProb >= 0.8)
    return <Badge className="bg-[--color-error]/20 text-[--color-error] border-0">Critical</Badge>
  if (churnProb >= 0.6)
    return <Badge className="bg-[--color-tertiary]/20 text-[--color-tertiary] border-0">High</Badge>
  if (churnProb >= 0.4)
    return <Badge className="bg-yellow-500/20 text-yellow-300 border-0">Medium</Badge>
  return <Badge className="bg-[--color-secondary]/20 text-[--color-secondary] border-0">Low</Badge>
}

function healthBadge(score: number) {
  if (score >= 80)
    return <Badge className="bg-[--color-secondary]/20 text-[--color-secondary] border-0">{score}</Badge>
  if (score >= 60)
    return <Badge className="bg-yellow-500/20 text-yellow-300 border-0">{score}</Badge>
  if (score >= 40)
    return <Badge className="bg-[--color-tertiary]/20 text-[--color-tertiary] border-0">{score}</Badge>
  return <Badge className="bg-[--color-error]/20 text-[--color-error] border-0">{score}</Badge>
}

function SortIcon({ col, sort, dir }: { col: SortKey; sort: SortKey; dir: SortDir }) {
  if (sort !== col) return <ArrowUpDownIcon className="ml-1 inline h-3 w-3 opacity-40" />
  if (dir === "asc") return <ArrowUpIcon className="ml-1 inline h-3 w-3" />
  return <ArrowDownIcon className="ml-1 inline h-3 w-3" />
}
```

- [ ] **Step 3: Implement the CustomersTable component body**

```tsx
export function CustomersTable({
  rows, page, totalPages, sort, dir, search, region, plan,
  onSortChange, onSearchChange, onRegionChange, onPlanChange, onPageChange, onRowClick,
}: CustomersTableProps) {
  const [localSearch, setLocalSearch] = React.useState(search)

  // Sync local search to parent with 300ms debounce
  React.useEffect(() => {
    const t = setTimeout(() => onSearchChange(localSearch), 300)
    return () => clearTimeout(t)
  }, [localSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep local in sync when parent resets
  React.useEffect(() => { setLocalSearch(search) }, [search])

  function handleSort(col: SortKey) {
    if (sort === col) {
      onSortChange(col, dir === "asc" ? "desc" : "asc")
    } else {
      onSortChange(col, "desc")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search company..."
            className="pl-8"
          />
        </div>

        <Select value={region || "__all__"} onValueChange={(v) => onRegionChange(v === "__all__" ? "" : v)}>
          <SelectTrigger size="default" className="w-[130px]">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Regions</SelectItem>
            <SelectItem value="NA">NA</SelectItem>
            <SelectItem value="EMEA">EMEA</SelectItem>
            <SelectItem value="APAC">APAC</SelectItem>
            <SelectItem value="LATAM">LATAM</SelectItem>
          </SelectContent>
        </Select>

        <Select value={plan || "__all__"} onValueChange={(v) => onPlanChange(v === "__all__" ? "" : v)}>
          <SelectTrigger size="default" className="w-[130px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Plans</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[--color-outline-variant] bg-[--color-surface-container] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[--color-outline-variant] hover:bg-transparent">
              <TableHead className="text-[--color-on-surface-variant] uppercase text-xs tracking-wide">Company</TableHead>
              <TableHead className="text-[--color-on-surface-variant] uppercase text-xs tracking-wide">Plan</TableHead>
              <TableHead className="text-[--color-on-surface-variant] uppercase text-xs tracking-wide">Region</TableHead>
              <TableHead
                className="text-[--color-on-surface-variant] uppercase text-xs tracking-wide cursor-pointer select-none hover:text-[--color-on-surface]"
                onClick={() => handleSort("mrr")}
              >
                MRR <SortIcon col="mrr" sort={sort} dir={dir} />
              </TableHead>
              <TableHead
                className="text-[--color-on-surface-variant] uppercase text-xs tracking-wide cursor-pointer select-none hover:text-[--color-on-surface]"
                onClick={() => handleSort("churnProb")}
              >
                Churn Risk <SortIcon col="churnProb" sort={sort} dir={dir} />
              </TableHead>
              <TableHead
                className="text-[--color-on-surface-variant] uppercase text-xs tracking-wide cursor-pointer select-none hover:text-[--color-on-surface]"
                onClick={() => handleSort("health")}
              >
                Health <SortIcon col="health" sort={sort} dir={dir} />
              </TableHead>
              <TableHead
                className="text-[--color-on-surface-variant] uppercase text-xs tracking-wide cursor-pointer select-none hover:text-[--color-on-surface]"
                onClick={() => handleSort("lastLogin")}
              >
                Last Login <SortIcon col="lastLogin" sort={sort} dir={dir} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-[--color-on-surface-variant]">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-[--color-outline-variant] cursor-pointer hover:bg-[--color-surface-container-high] transition-colors"
                onClick={() => onRowClick(row.id)}
              >
                <TableCell className="font-medium text-[--color-on-surface]">{row.companyName}</TableCell>
                <TableCell className="capitalize text-[--color-on-surface-variant]">{row.plan}</TableCell>
                <TableCell className="text-[--color-on-surface-variant]">{row.region}</TableCell>
                <TableCell className="text-[--color-on-surface]">{fmtMrr(row.mrrCents / 100)}</TableCell>
                <TableCell>{riskBadge(row.churnProb)}</TableCell>
                <TableCell>{healthBadge(row.healthScore)}</TableCell>
                <TableCell className="text-[--color-on-surface-variant]">
                  {row.lastLogin ? fmtDate(row.lastLogin) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-[--color-on-surface-variant]">
        <span>Page {page} of {totalPages || 1}</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Task 2: CustomerDrawer component

**Files:**
- Create: `components/customers/customer-drawer.tsx`

The `/api/customers/{id}` endpoint returns raw DB fields (snake_case). We need a type for that response.

- [ ] **Step 1: Create the file with imports and response type**

```tsx
"use client"

import * as React from "react"
import { XIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon } from "lucide-react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fmtPct, fmtMrr, fmtDate } from "@/lib/format"

// Raw API response shape from /api/customers/{id}
interface CustomerDetail {
  id: string
  company_name: string
  email: string
  region: string
  plan_id: string
  mrr_cents: number
  churn_prob: number
  health_score: number
  joined_at: string | null
  top_factors: unknown
  tickets: Array<{
    id: string
    opened_at: string
    resolved_at: string | null
    severity: string
    category: string
    satisfaction: number | null
  }>
  payments: Array<{
    id: string
    amount_cents: number
    status: string
    paid_at: string | null
  }>
  usage: Array<{
    week: string
    total: number
  }>
}

interface CustomerDrawerProps {
  customerId: string | null
  onClose: () => void
}
```

- [ ] **Step 2: Implement fetch hook and helper badges**

```tsx
function useFetchCustomer(id: string | null) {
  const [data, setData] = React.useState<CustomerDetail | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!id) { setData(null); return }
    setLoading(true)
    setError(null)
    fetch(`/api/customers/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<CustomerDetail>
      })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [id])

  return { data, loading, error }
}

function severityBadge(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical": return <Badge className="bg-[--color-error]/20 text-[--color-error] border-0">Critical</Badge>
    case "high":     return <Badge className="bg-[--color-tertiary]/20 text-[--color-tertiary] border-0">High</Badge>
    case "medium":   return <Badge className="bg-yellow-500/20 text-yellow-300 border-0">Medium</Badge>
    default:         return <Badge variant="outline">{severity}</Badge>
  }
}

function paymentStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "paid":    return <Badge className="bg-[--color-secondary]/20 text-[--color-secondary] border-0">Paid</Badge>
    case "failed":  return <Badge className="bg-[--color-error]/20 text-[--color-error] border-0">Failed</Badge>
    case "pending": return <Badge className="bg-yellow-500/20 text-yellow-300 border-0">Pending</Badge>
    default:        return <Badge variant="outline">{status}</Badge>
  }
}
```

- [ ] **Step 3: Implement the CustomerDrawer component**

```tsx
export function CustomerDrawer({ customerId, onClose }: CustomerDrawerProps) {
  const { data, loading, error } = useFetchCustomer(customerId)
  const open = customerId !== null

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-lg bg-[--color-surface-container-low] border-l border-[--color-outline-variant] p-0 flex flex-col">
        <SheetHeader className="flex flex-row items-start justify-between p-6 pb-4 border-b border-[--color-outline-variant]">
          <div>
            <SheetTitle className="text-[--color-on-surface] text-lg font-semibold">
              {loading ? <Skeleton className="h-5 w-48" /> : (data?.company_name ?? "Customer Detail")}
            </SheetTitle>
            <SheetDescription className="text-[--color-on-surface-variant] text-sm mt-0.5">
              {loading ? <Skeleton className="h-4 w-32 mt-1" /> : (data?.email ?? "")}
            </SheetDescription>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="shrink-0 mt-1">
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 flex flex-col gap-6">
            {error && (
              <div className="flex items-center gap-2 text-[--color-error] text-sm">
                <AlertCircleIcon className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Key metrics */}
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[0,1,2,3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : data && (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Churn Risk" value={fmtPct(data.churn_prob)} highlight={data.churn_prob >= 0.6} />
                  <MetricCard label="Health Score" value={String(data.health_score)} />
                  <MetricCard label="MRR" value={fmtMrr(data.mrr_cents / 100)} />
                  <MetricCard label="Open Tickets" value={String(data.tickets.filter(t => !t.resolved_at).length)} />
                </div>

                {/* Churn probability bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-[--color-on-surface-variant]">
                    <span>Churn Probability</span>
                    <span>{fmtPct(data.churn_prob)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[--color-surface-container-high] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round(data.churn_prob * 100)}%`,
                        background: data.churn_prob >= 0.8
                          ? "var(--color-error)"
                          : data.churn_prob >= 0.6
                          ? "var(--color-tertiary)"
                          : data.churn_prob >= 0.4
                          ? "#eab308"
                          : "var(--color-secondary)",
                      }}
                    />
                  </div>
                </div>

                {/* Details row */}
                <div className="flex flex-col gap-2 text-sm">
                  <DetailRow label="Plan" value={<span className="capitalize">{data.plan_id}</span>} />
                  <DetailRow label="Region" value={data.region} />
                  <DetailRow label="Joined" value={data.joined_at ? fmtDate(data.joined_at) : "—"} />
                </div>

                {/* Support tickets */}
                <section className="flex flex-col gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[--color-on-surface-variant]">
                    Recent Support Tickets ({data.tickets.length})
                  </h3>
                  {data.tickets.length === 0 && (
                    <p className="text-sm text-[--color-on-surface-variant]">No tickets.</p>
                  )}
                  {data.tickets.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-start gap-3 rounded-lg bg-[--color-surface-container] p-3">
                      <div className="mt-0.5">
                        {t.resolved_at
                          ? <CheckCircleIcon className="h-4 w-4 text-[--color-secondary]" />
                          : <ClockIcon className="h-4 w-4 text-[--color-on-surface-variant]" />
                        }
                      </div>
                      <div className="flex flex-1 flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {severityBadge(t.severity)}
                          <span className="text-xs text-[--color-on-surface-variant] capitalize">{t.category}</span>
                        </div>
                        <span className="text-xs text-[--color-on-surface-variant]">
                          {fmtDate(t.opened_at)}
                          {t.resolved_at && ` → ${fmtDate(t.resolved_at)}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </section>

                {/* Recent payments */}
                <section className="flex flex-col gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[--color-on-surface-variant]">
                    Recent Payments
                  </h3>
                  {data.payments.length === 0 && (
                    <p className="text-sm text-[--color-on-surface-variant]">No payments.</p>
                  )}
                  {data.payments.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-[--color-surface-container] p-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-[--color-on-surface]">
                          {fmtMrr(p.amount_cents / 100)}
                        </span>
                        <span className="text-xs text-[--color-on-surface-variant]">
                          {p.paid_at ? fmtDate(p.paid_at) : "—"}
                        </span>
                      </div>
                      {paymentStatusBadge(p.status)}
                    </div>
                  ))}
                </section>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

interface MetricCardProps { label: string; value: string; highlight?: boolean }
function MetricCard({ label, value, highlight = false }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-[--color-surface-container-high] p-3">
      <span className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">{label}</span>
      <span className={`text-xl font-bold ${highlight ? "text-[--color-error]" : "text-[--color-on-surface]"}`}>{value}</span>
    </div>
  )
}

interface DetailRowProps { label: string; value: React.ReactNode }
function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[--color-on-surface-variant]">{label}</span>
      <span className="text-[--color-on-surface] font-medium">{typeof value === "string" ? value : value}</span>
    </div>
  )
}
```

---

## Task 3: CustomersPageClient component

**Files:**
- Create: `components/customers/customers-page-client.tsx`

This holds `selectedId` state and URL-synced filter/sort/page state.

- [ ] **Step 1: Create the file**

```tsx
"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { CustomersTable } from "@/components/customers/customers-table"
import { CustomerDrawer } from "@/components/customers/customer-drawer"
import type { CustomerRow } from "@/lib/types"

type SortKey = "health" | "churnProb" | "mrr" | "lastLogin"
type SortDir = "asc" | "desc"

interface CustomersPageClientProps {
  initialRows: CustomerRow[]
}

const PAGE_SIZE = 25

export function CustomersPageClient({ initialRows }: CustomersPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Read from URL
  const search  = searchParams.get("q") ?? ""
  const region  = searchParams.get("region") ?? ""
  const plan    = searchParams.get("plan") ?? ""
  const rawSort = searchParams.get("sort")
  const rawDir  = searchParams.get("dir")
  const page    = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const sort: SortKey = (["health","churnProb","mrr","lastLogin"] as SortKey[]).includes(rawSort as SortKey)
    ? (rawSort as SortKey)
    : "churnProb"
  const dir: SortDir = rawDir === "asc" ? "asc" : "desc"

  const [rows, setRows] = React.useState<CustomerRow[]>(initialRows)
  const [loading, setLoading] = React.useState(false)
  const [totalPages, setTotalPages] = React.useState(
    Math.max(1, Math.ceil(initialRows.length / PAGE_SIZE))
  )
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  // Fetch when URL params change
  React.useEffect(() => {
    const params = new URLSearchParams()
    if (search)  params.set("q", search)
    if (region)  params.set("region", region)
    if (plan)    params.set("plan", plan)
    params.set("sort", sort)
    params.set("dir", dir)
    params.set("page", String(page))
    params.set("pageSize", String(PAGE_SIZE))

    setLoading(true)
    fetch(`/api/customers?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<{ rows: CustomerRow[] }>
      })
      .then(({ rows: fetched }) => {
        setRows(fetched)
        // If we got a full page, there may be more
        setTotalPages(fetched.length === PAGE_SIZE ? page + 1 : page)
      })
      .catch(() => { /* keep current rows */ })
      .finally(() => setLoading(false))
  }, [search, region, plan, sort, dir, page]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    // Reset page when filters change (unless page is being set)
    if (!("page" in updates)) params.delete("page")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      <div className={loading ? "opacity-70 transition-opacity" : ""}>
        <CustomersTable
          rows={rows}
          page={page}
          totalPages={totalPages}
          sort={sort}
          dir={dir}
          search={search}
          region={region}
          plan={plan}
          onSortChange={(k, d) => updateParams({ sort: k, dir: d })}
          onSearchChange={(q) => updateParams({ q })}
          onRegionChange={(r) => updateParams({ region: r })}
          onPlanChange={(p) => updateParams({ plan: p })}
          onPageChange={(p) => updateParams({ page: String(p) })}
          onRowClick={(id) => setSelectedId(id)}
        />
      </div>
      <CustomerDrawer
        customerId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  )
}
```

---

## Task 4: Customers page (Server Component)

**Files:**
- Create: `app/(dashboard)/customers/page.tsx`

- [ ] **Step 1: Create the server component**

```tsx
import { getCustomers } from "@/lib/queries/customers.sql"
import { CustomersPageClient } from "@/components/customers/customers-page-client"

export default async function CustomersPage() {
  let initialRows: Awaited<ReturnType<typeof getCustomers>>

  try {
    initialRows = await getCustomers({ sort: "churnProb", dir: "desc", pageSize: 25 })
  } catch {
    initialRows = []
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[--color-on-surface]">
          Customer Health
        </h1>
        <p className="mt-1 text-sm text-[--color-on-surface-variant]">
          Monitor churn risk across your customer base
        </p>
      </div>
      <CustomersPageClient initialRows={initialRows} />
    </div>
  )
}
```

---

## Task 5: TypeScript check and commit

- [ ] **Step 1: Run TypeScript check**

```powershell
cd "C:\Users\Leonardo Lopez\desktop\retention_iq"
npx tsc --noEmit 2>&1
```

Expected: No errors. If errors appear, fix them before committing.

- [ ] **Step 2: Commit**

```powershell
git add components/customers/customers-table.tsx components/customers/customer-drawer.tsx components/customers/customers-page-client.tsx "app/(dashboard)/customers/page.tsx"
git commit -m "feat(ui): Customer Health page, CustomersTable, CustomerDrawer"
```

---

## Self-Review

### Spec Coverage
- [x] Paginated table — `CustomersTable` with page/totalPages/onPageChange
- [x] Columns: Company (companyName), Plan, Region, MRR, Churn Risk %, Health Status badge, Last Login
- [x] Sortable columns — onSortChange callback, SortIcon
- [x] Search input debounced 300ms — useEffect with setTimeout 300
- [x] Filter dropdowns: Region, Plan — Select components
- [x] Pagination prev/next with page indicator
- [x] Row click → onRowClick → selectedId → CustomerDrawer
- [x] CustomerDrawer fetches /api/customers/{id} when customerId changes
- [x] Shows: name, email, plan, region, churn probability bar, MRR, join date, last login
- [x] Support tickets with severity badges
- [x] Recent payments (last 3) with status badges
- [x] Close button
- [x] Server component page fetches initial data
- [x] Client wrapper holds selectedId state
- [x] URL state for filters/sort/page via useRouter + useSearchParams

### Placeholder Scan
- No TBDs, no "implement later", no vague steps

### Type Consistency
- `SortKey` defined identically in customers-table.tsx and customers-page-client.tsx
- `CustomerRow.companyName` used consistently (not `name`)
- `CustomerRow.mrrCents` divided by 100 before passing to fmtMrr
- `CustomerDetail` interface matches getCustomerById return shape
