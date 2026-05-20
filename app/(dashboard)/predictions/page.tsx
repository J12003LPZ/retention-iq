import {
  getFeatureImportance,
  getRiskSegments,
  getTopToSave,
} from "@/lib/queries/predictions.sql"
import { FeatureImportanceChart } from "@/components/charts/feature-importance-chart"
import { RiskSegmentsChart } from "@/components/charts/risk-segments-chart"
import { fmtMrr, fmtPct, fmtNum } from "@/lib/format"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { FeatureImportance, RiskBand } from "@/lib/types"
import type { TopSaveRow } from "@/lib/queries/predictions.sql"

const RISK_BAND_ORDER: Record<RiskBand, number> = {
  critical: 0,
  high: 1,
  moderate: 2,
  safe: 3,
}

const RISK_BAND_COLORS: Record<RiskBand, string> = {
  critical: "bg-red-500/15 text-red-400",
  high: "bg-orange-500/15 text-orange-400",
  moderate: "bg-amber-500/15 text-amber-400",
  safe: "bg-emerald-500/15 text-emerald-400",
}

export default async function PredictionsPage() {
  let features: FeatureImportance[]
  let segments: Awaited<ReturnType<typeof getRiskSegments>>
  let topToSave: TopSaveRow[]

  try {
    ;[features, segments, topToSave] = await Promise.all([
      getFeatureImportance(),
      getRiskSegments(),
      getTopToSave(20),
    ])
  } catch {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-lg font-semibold text-[--color-on-surface]">Unable to load prediction data</p>
        <p className="text-sm text-[--color-on-surface-variant]">Check your database connection and try again.</p>
      </div>
    )
  }

  const sortedSegments = [...segments].sort(
    (a, b) => (RISK_BAND_ORDER[a.band] ?? 99) - (RISK_BAND_ORDER[b.band] ?? 99)
  )

  const totalAtRiskCustomers = segments
    .filter((s) => s.band === "critical" || s.band === "high")
    .reduce((sum, s) => sum + s.customers, 0)

  return (
    <div className="flex flex-col gap-10 animate-fade-up">
      {/* Page header */}
      <header className="flex flex-col gap-3 border-b border-[--color-outline-variant]/40 pb-6">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[--color-on-surface-variant]">
          <span className="h-px w-8 bg-[--color-primary]" />
          <span>Churn Predictions</span>
        </div>
        <h1
          className="font-display text-[3.25rem] font-medium leading-[0.95] tracking-[-0.035em] text-[--color-on-surface]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 80, 'WONK' 0" }}
        >
          Churn <span className="italic text-[--color-primary]">Predictions</span>
        </h1>
        <p className="max-w-2xl text-[16px] leading-relaxed text-[--color-on-surface-variant]">
          ML-driven risk segmentation, feature drivers, and top customers to save
        </p>
      </header>

      {/* Risk segment summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {sortedSegments.map((seg) => (
          <Card key={seg.band} className="bg-[--color-surface-container] ring-[--color-outline-variant]">
            <CardHeader className="pb-1">
              <p className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">
                {seg.band.charAt(0).toUpperCase() + seg.band.slice(1)}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-display text-[--color-on-surface]">
                {fmtNum(seg.customers)}
              </p>
              <p className="mt-1 text-xs text-[--color-on-surface-variant]">
                {fmtMrr(seg.mrrCents / 100)} MRR
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Feature importance */}
        <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[--color-on-surface]">
              Feature Importance
            </CardTitle>
            <p className="text-xs text-[--color-on-surface-variant]">
              Factors with the greatest influence on churn probability
            </p>
          </CardHeader>
          <CardContent>
            <FeatureImportanceChart data={features} />
          </CardContent>
        </Card>

        {/* Risk segments donut */}
        <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[--color-on-surface]">
              Risk Segments
            </CardTitle>
            <p className="text-xs text-[--color-on-surface-variant]">
              Customer distribution by churn risk band
            </p>
          </CardHeader>
          <CardContent>
            <RiskSegmentsChart data={segments} />
            {totalAtRiskCustomers > 0 && (
              <p className="mt-2 text-center text-xs text-[--color-on-surface-variant]">
                {fmtNum(totalAtRiskCustomers)} customers at high or critical risk
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top customers to save */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <h2 className="font-display text-[1.5rem] font-medium leading-tight tracking-tight text-[--color-on-surface]">
            Top Customers to <span className="italic text-[--color-on-surface-variant] font-normal">Save</span>
          </h2>
          <p className="text-xs text-[--color-on-surface-variant]">
            Ranked by churn probability × MRR impact
          </p>
        </CardHeader>
        <CardContent>
          {topToSave.length === 0 ? (
            <p className="text-sm text-[--color-on-surface-variant]">No high-risk customers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[--color-outline-variant]">
                    <th className="pb-2 text-left font-medium text-[--color-on-surface-variant]">Company</th>
                    <th className="pb-2 text-left font-medium text-[--color-on-surface-variant]">Region</th>
                    <th className="pb-2 text-left font-medium text-[--color-on-surface-variant]">Plan</th>
                    <th className="pb-2 text-right font-medium text-[--color-on-surface-variant]">MRR</th>
                    <th className="pb-2 text-right font-medium text-[--color-on-surface-variant]">Churn Prob.</th>
                    <th className="pb-2 text-right font-medium text-[--color-on-surface-variant]">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {topToSave.map((row) => {
                    const band: RiskBand =
                      row.churnProb >= 0.85
                        ? "critical"
                        : row.churnProb >= 0.6
                        ? "high"
                        : row.churnProb >= 0.35
                        ? "moderate"
                        : "safe"
                    return (
                      <tr key={row.id} className="border-b border-[--color-outline-variant]/40">
                        <td className="py-3 font-medium text-[--color-on-surface]">{row.companyName}</td>
                        <td className="py-3 text-[--color-on-surface-variant]">{row.region}</td>
                        <td className="py-3 capitalize text-[--color-on-surface-variant]">{row.planId}</td>
                        <td className="py-3 text-right text-[--color-on-surface]">{fmtMrr(row.mrrCents / 100)}</td>
                        <td className="py-3 text-right text-[--color-on-surface]">{fmtPct(row.churnProb)}</td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${RISK_BAND_COLORS[band]}`}
                          >
                            {band}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
