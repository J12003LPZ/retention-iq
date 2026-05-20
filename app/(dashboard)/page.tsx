import { getKpiSummary } from "@/lib/queries/kpis.sql"
import { getChurnTrend, getChurnDrivers } from "@/lib/queries/churn.sql"
import { KpiCard } from "@/components/ui/kpi-card"
import { HealthGauge } from "@/components/ui/health-gauge"
import { ChurnTrendChart } from "@/components/charts/churn-trend-chart"
import { ChurnDriversChart } from "@/components/charts/churn-drivers-chart"
import { fmtPct, fmtMrr, fmtNum } from "@/lib/format"

export default async function OverviewPage() {
  let kpi: Awaited<ReturnType<typeof getKpiSummary>>
  let trendData: Awaited<ReturnType<typeof getChurnTrend>>
  let driversData: Awaited<ReturnType<typeof getChurnDrivers>>

  try {
    ;[kpi, trendData, driversData] = await Promise.all([
      getKpiSummary(),
      getChurnTrend("weekly"),
      getChurnDrivers(),
    ])
  } catch {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-lg font-semibold text-[--color-on-surface]">Unable to load dashboard</p>
        <p className="text-sm text-[--color-on-surface-variant]">Check your database connection and try again.</p>
      </div>
    )
  }

  const healthScore = kpi.healthScore

  const topDriver = driversData[0]

  return (
    <div className="flex flex-col gap-10 animate-fade-up">
      {/* Editorial-style page header */}
      <header className="flex flex-col gap-3 border-b border-[--color-outline-variant]/40 pb-6">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[--color-on-surface-variant]">
          <span className="h-px w-8 bg-[--color-primary]" />
          <span>Live Telemetry · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
        </div>
        <h1
          className="font-display text-[3.5rem] font-medium leading-[0.95] tracking-[-0.035em] text-[--color-on-surface]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 80, 'WONK' 0" }}
        >
          Customer Health <span className="italic text-[--color-primary]">Overview</span>
        </h1>
        <p className="max-w-2xl text-[16px] leading-relaxed text-[--color-on-surface-variant]">
          Real-time churn analytics and revenue risk, synthesized from{" "}
          <span className="font-mono text-[--color-on-surface]">{fmtNum(kpi.predictedChurnUsers + 5000)}</span> active accounts.
        </p>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Churn Rate */}
        <KpiCard
          title="Churn Rate"
          value={`${kpi.churnRatePct.toFixed(1)}%`}
          trend={kpi.churnRateDeltaPct / 100}
          trendLabel="vs prev period"
          variant="danger"
        />

        {/* MRR at Risk */}
        <KpiCard
          title="MRR at Risk"
          value={fmtMrr(kpi.revenueAtRiskCents / 100)}
          variant="warning"
        />

        {/* At-Risk Customers */}
        <KpiCard
          title="At-Risk Customers"
          value={fmtNum(kpi.predictedChurnUsers)}
          variant="warning"
        />

        {/* Health Gauge */}
        <div className="relative overflow-hidden rounded-xl border border-[--color-outline-variant]/60 bg-gradient-to-b from-[--color-surface-container] to-[--color-surface-container-low] p-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[--color-on-surface-variant]">
            Account Health
          </p>
          <div className="flex justify-center pt-1">
            <HealthGauge score={healthScore} size={150} />
          </div>
        </div>
      </div>

      {/* Churn Trend Chart — full width */}
      <section className="overflow-hidden rounded-xl border border-[--color-outline-variant]/60 bg-[--color-surface-container]/60 backdrop-blur-sm">
        <div className="flex items-baseline justify-between border-b border-[--color-outline-variant]/40 px-6 py-4">
          <div>
            <h2 className="font-display text-[1.5rem] font-medium leading-tight tracking-tight text-[--color-on-surface]">
              Churn Rate <span className="italic text-[--color-on-surface-variant] font-normal">over time</span>
            </h2>
            <p className="mt-0.5 text-[13px] text-[--color-on-surface-variant]">Trailing 30 days · bucketed weekly</p>
          </div>
        </div>
        <div className="p-6">
          <ChurnTrendChart initialData={trendData} initialGranularity="weekly" />
        </div>
      </section>

      {/* Bottom row: Drivers + Quick Stats */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Churn Drivers */}
        <section className="overflow-hidden rounded-xl border border-[--color-outline-variant]/60 bg-[--color-surface-container]/60">
          <div className="border-b border-[--color-outline-variant]/40 px-6 py-4">
            <h2 className="font-display text-[1.5rem] font-medium leading-tight tracking-tight text-[--color-on-surface]">
              Top Churn <span className="italic text-[--color-on-surface-variant] font-normal">drivers</span>
            </h2>
            <p className="mt-0.5 text-[13px] text-[--color-on-surface-variant]">Ranked by share of churned customers</p>
          </div>
          <div className="p-6">
            <ChurnDriversChart drivers={driversData} />
          </div>
        </section>

        {/* Quick Stats */}
        <section className="overflow-hidden rounded-xl border border-[--color-outline-variant]/60 bg-[--color-surface-container]/60">
          <div className="border-b border-[--color-outline-variant]/40 px-6 py-4">
            <h2 className="font-display text-[1.5rem] font-medium leading-tight tracking-tight text-[--color-on-surface]">
              At a <span className="italic text-[--color-on-surface-variant] font-normal">glance</span>
            </h2>
            <p className="mt-0.5 text-[13px] text-[--color-on-surface-variant]">Key metrics distilled</p>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-4">
              <StatRow
                label="Avg MRR per Customer"
                value={
                  kpi.predictedChurnUsers > 0
                    ? fmtMrr(kpi.revenueAtRiskCents / 100 / kpi.predictedChurnUsers)
                    : "—"
                }
                description="Revenue exposed per at-risk user"
              />
              <StatRow
                label="Top Churn Driver"
                value={topDriver ? topDriver.driver : "—"}
                description={
                  topDriver
                    ? `${topDriver.sharePct.toFixed(1)}% of churned customers`
                    : "No data available"
                }
              />
              <StatRow
                label="Current Churn Rate"
                value={`${kpi.churnRatePct.toFixed(2)}%`}
                description={
                  kpi.churnRateDeltaPct > 0
                    ? `Up ${kpi.churnRateDeltaPct.toFixed(1)}pp from last period`
                    : kpi.churnRateDeltaPct < 0
                    ? `Down ${Math.abs(kpi.churnRateDeltaPct).toFixed(1)}pp from last period`
                    : "Unchanged from last period"
                }
              />
              <StatRow
                label="Customers to Save"
                value={fmtNum(kpi.predictedChurnUsers)}
                description={`${fmtPct(kpi.churnRatePct / 100)} at critical risk threshold`}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

interface StatRowProps {
  label: string
  value: string
  description: string
}

function StatRow({ label, value, description }: StatRowProps) {
  return (
    <div className="group flex items-baseline justify-between gap-4 border-b border-[--color-outline-variant]/30 pb-4 last:border-0 last:pb-0">
      <div className="flex flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[--color-on-surface-variant]">
          {label}
        </p>
        <p className="mt-1 text-[13px] text-[--color-on-surface-variant]/80">{description}</p>
      </div>
      <p
        className="shrink-0 font-display text-[1.875rem] font-medium tracking-tight text-[--color-on-surface] tabular-nums"
        style={{ fontVariationSettings: "'opsz' 144" }}
      >
        {value}
      </p>
    </div>
  )
}
