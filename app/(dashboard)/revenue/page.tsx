import { getRevenueRiskBands, getRevenueSankey } from "@/lib/queries/revenue.sql"
import { RevenueRiskChart } from "@/components/charts/revenue-risk-chart"
import { KpiCard } from "@/components/ui/kpi-card"
import { fmtMrr, fmtNum } from "@/lib/format"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { RevenueRiskBand } from "@/lib/types"

export default async function RevenuePage() {
  let bands: RevenueRiskBand[]
  let sankey: Awaited<ReturnType<typeof getRevenueSankey>>

  try {
    ;[bands, sankey] = await Promise.all([
      getRevenueRiskBands(),
      getRevenueSankey(),
    ])
  } catch {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-lg font-semibold text-[--color-on-surface]">Unable to load revenue data</p>
        <p className="text-sm text-[--color-on-surface-variant]">Check your database connection and try again.</p>
      </div>
    )
  }

  // Summary calculations
  const atRiskBands = bands.filter((b) => b.band === "critical" || b.band === "high")
  const totalAtRiskMrr = atRiskBands.reduce((sum, b) => sum + b.mrrCents, 0)
  const totalMrr = bands.reduce((sum, b) => sum + b.mrrCents, 0)
  const atRiskPct = totalMrr > 0 ? totalAtRiskMrr / totalMrr : 0

  const highestRiskBand = [...bands].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, moderate: 2, safe: 3 }
    return (order[a.band] ?? 99) - (order[b.band] ?? 99)
  })[0]

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[--color-on-surface]">
          Revenue Risk Analysis
        </h1>
        <p className="mt-1 text-sm text-[--color-on-surface-variant]">
          MRR exposure by churn risk band
        </p>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="MRR at Risk"
          value={fmtMrr(totalAtRiskMrr / 100)}
          variant="danger"
        />
        <KpiCard
          title="% of Total MRR"
          value={`${(atRiskPct * 100).toFixed(1)}%`}
          variant="warning"
        />
        <KpiCard
          title="Highest Risk Band"
          value={
            highestRiskBand
              ? highestRiskBand.band.charAt(0).toUpperCase() + highestRiskBand.band.slice(1)
              : "—"
          }
          variant="danger"
        />
      </div>

      {/* Revenue risk bar chart */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[--color-on-surface]">
            MRR at Risk by Band
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueRiskChart data={bands} />
        </CardContent>
      </Card>

      {/* Band breakdown table */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[--color-on-surface]">
            Band Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[--color-outline-variant]">
                  <th className="pb-2 text-left font-medium text-[--color-on-surface-variant]">Band</th>
                  <th className="pb-2 text-right font-medium text-[--color-on-surface-variant]">Customers</th>
                  <th className="pb-2 text-right font-medium text-[--color-on-surface-variant]">MRR at Risk</th>
                  <th className="pb-2 text-right font-medium text-[--color-on-surface-variant]">% of Total MRR</th>
                </tr>
              </thead>
              <tbody>
                {[...bands]
                  .sort((a, b) => {
                    const order: Record<string, number> = { critical: 0, high: 1, moderate: 2, safe: 3 }
                    return (order[a.band] ?? 99) - (order[b.band] ?? 99)
                  })
                  .map((band) => (
                    <tr key={band.band} className="border-b border-[--color-outline-variant]/40">
                      <td className="py-3 font-medium capitalize text-[--color-on-surface]">{band.band}</td>
                      <td className="py-3 text-right text-[--color-on-surface-variant]">{fmtNum(band.customers)}</td>
                      <td className="py-3 text-right text-[--color-on-surface]">{fmtMrr(band.mrrCents / 100)}</td>
                      <td className="py-3 text-right text-[--color-on-surface-variant]">
                        {totalMrr > 0 ? `${((band.mrrCents / totalMrr) * 100).toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sankey / Flow Table */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[--color-on-surface]">
            Customer Flow Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[--color-outline-variant]">
                  <th className="pb-2 text-left font-medium text-[--color-on-surface-variant]">Bucket</th>
                  <th className="pb-2 text-right font-medium text-[--color-on-surface-variant]">Users</th>
                  <th className="pb-2 text-right font-medium text-[--color-on-surface-variant]">MRR</th>
                </tr>
              </thead>
              <tbody>
                {sankey.map((row) => (
                  <tr key={row.bucket} className="border-b border-[--color-outline-variant]/40">
                    <td className="py-3 font-medium capitalize text-[--color-on-surface]">
                      {row.bucket.replace("_", " ")}
                    </td>
                    <td className="py-3 text-right text-[--color-on-surface-variant]">{fmtNum(row.users)}</td>
                    <td className="py-3 text-right text-[--color-on-surface]">{fmtMrr(row.mrrCents / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
