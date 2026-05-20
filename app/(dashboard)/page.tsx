import { getKpiSummary } from "@/lib/queries/kpis.sql"
import { getChurnTrend, getChurnDrivers } from "@/lib/queries/churn.sql"
import { KpiCard } from "@/components/ui/kpi-card"
import { HealthGauge } from "@/components/ui/health-gauge"
import { ChurnTrendChart } from "@/components/charts/churn-trend-chart"
import { ChurnDriversChart } from "@/components/charts/churn-drivers-chart"
import { fmtPct, fmtMrr, fmtNum } from "@/lib/format"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function OverviewPage() {
  const [kpi, trendData, driversData] = await Promise.all([
    getKpiSummary(),
    getChurnTrend("weekly"),
    getChurnDrivers(),
  ])

  const healthScore = kpi.healthScore

  const topDriver = driversData[0]

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[--color-on-surface]">
          Customer Health Overview
        </h1>
        <p className="mt-1 text-sm text-[--color-on-surface-variant]">
          Real-time churn analytics and revenue risk at a glance
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <Card className="bg-[--color-surface-container] ring-[--color-outline-variant] text-[--color-on-surface]">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-[--color-on-surface-variant] tracking-wide uppercase">
              Account Health
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pt-2">
            <HealthGauge score={healthScore} size={140} />
          </CardContent>
        </Card>
      </div>

      {/* Churn Trend Chart — full width */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[--color-on-surface]">
            Churn Rate Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChurnTrendChart initialData={trendData} initialGranularity="weekly" />
        </CardContent>
      </Card>

      {/* Bottom row: Drivers + Quick Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Churn Drivers */}
        <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[--color-on-surface]">
              Top Churn Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChurnDriversChart drivers={driversData} />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[--color-on-surface]">
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
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
    <div className="flex flex-col gap-0.5 rounded-lg bg-[--color-surface-container-high] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">
        {label}
      </p>
      <p className="text-xl font-bold text-[--color-on-surface]">{value}</p>
      <p className="text-xs text-[--color-on-surface-variant]">{description}</p>
    </div>
  )
}
