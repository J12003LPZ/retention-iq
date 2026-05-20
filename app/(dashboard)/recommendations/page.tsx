import { sql } from "@/lib/db"
import { fmtMrr, fmtNum } from "@/lib/format"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const revalidate = 300

interface Rule {
  id: string
  title: string
  where: string
  action: string
  confidence: number
  expectedReductionPct: number
}

interface RecommendationResult extends Rule {
  customers: number
  mrrCents: number
}

const RULES: Rule[] = [
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
]

async function getRecommendations(): Promise<RecommendationResult[]> {
  const out: RecommendationResult[] = []
  for (const r of RULES) {
    const rows = await sql`
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
    ` as unknown as Array<{ customers: number; mrr_cents: number }>
    const row = rows[0]
    out.push({
      ...r,
      customers: row?.customers ?? 0,
      mrrCents: Number(row?.mrr_cents ?? 0),
    })
  }
  return out
}

function priorityLabel(mrrCents: number, expectedReductionPct: number): {
  label: string
  classes: string
} {
  const impact = (mrrCents / 100) * (expectedReductionPct / 100)
  if (impact >= 5000) return { label: "High Priority", classes: "bg-red-500/15 text-red-400" }
  if (impact >= 1000) return { label: "Medium", classes: "bg-amber-500/15 text-amber-400" }
  return { label: "Low", classes: "bg-emerald-500/15 text-emerald-400" }
}

export default async function RecommendationsPage() {
  let recommendations: RecommendationResult[]

  try {
    recommendations = await getRecommendations()
  } catch {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-lg font-semibold text-[--color-on-surface]">Unable to load recommendations</p>
        <p className="text-sm text-[--color-on-surface-variant]">Check your database connection and try again.</p>
      </div>
    )
  }

  // Sort by MRR at risk descending
  const sorted = [...recommendations].sort((a, b) => b.mrrCents - a.mrrCents)

  const totalMrrAtRisk = sorted.reduce((sum, r) => sum + r.mrrCents, 0)
  const totalAffected = sorted.reduce((sum, r) => sum + r.customers, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[--color-on-surface]">
          Recommendations
        </h1>
        <p className="mt-1 text-sm text-[--color-on-surface-variant]">
          Actionable playbooks ranked by revenue impact
        </p>
      </div>

      {/* Summary row */}
      <div className="flex flex-wrap gap-4">
        <div className="rounded-lg bg-[--color-surface-container] px-5 py-4 ring-1 ring-[--color-outline-variant]">
          <p className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">Total MRR at Risk</p>
          <p className="mt-1 text-2xl font-bold text-[--color-on-surface]">{fmtMrr(totalMrrAtRisk / 100)}</p>
        </div>
        <div className="rounded-lg bg-[--color-surface-container] px-5 py-4 ring-1 ring-[--color-outline-variant]">
          <p className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">Affected Customers</p>
          <p className="mt-1 text-2xl font-bold text-[--color-on-surface]">{fmtNum(totalAffected)}</p>
        </div>
        <div className="rounded-lg bg-[--color-surface-container] px-5 py-4 ring-1 ring-[--color-outline-variant]">
          <p className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">Active Playbooks</p>
          <p className="mt-1 text-2xl font-bold text-[--color-on-surface]">{sorted.length}</p>
        </div>
      </div>

      {/* Recommendation cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {sorted.map((rec) => {
          const priority = priorityLabel(rec.mrrCents, rec.expectedReductionPct)
          const estimatedSavings = (rec.mrrCents / 100) * (rec.expectedReductionPct / 100)
          return (
            <Card key={rec.id} className="flex flex-col bg-[--color-surface-container] ring-[--color-outline-variant]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base font-semibold text-[--color-on-surface] leading-snug">
                    {rec.title}
                  </CardTitle>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${priority.classes}`}
                  >
                    {priority.label}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                {/* Action description */}
                <p className="text-sm text-[--color-on-surface-variant]">{rec.action}</p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-[--color-surface-container-high] px-3 py-2.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">
                      Affected
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-[--color-on-surface]">
                      {fmtNum(rec.customers)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[--color-surface-container-high] px-3 py-2.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">
                      MRR at Risk
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-[--color-on-surface]">
                      {fmtMrr(rec.mrrCents / 100)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[--color-surface-container-high] px-3 py-2.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">
                      Confidence
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-[--color-on-surface]">
                      {(rec.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-[--color-surface-container-high] px-3 py-2.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">
                      Est. Savings
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-emerald-400">
                      {fmtMrr(estimatedSavings)}
                    </p>
                  </div>
                </div>

                {/* Expected churn reduction */}
                <div className="mt-auto flex items-center justify-between rounded-lg bg-[--color-outline-variant]/20 px-3 py-2 text-xs text-[--color-on-surface-variant]">
                  <span>Expected churn reduction</span>
                  <span className="font-bold text-emerald-400">−{rec.expectedReductionPct}%</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
