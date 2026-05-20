import { getSupportAnalytics } from "@/lib/queries/support.sql"
import { KpiCard } from "@/components/ui/kpi-card"
import { fmtNum } from "@/lib/format"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function SupportPage() {
  let rows: Awaited<ReturnType<typeof getSupportAnalytics>>

  try {
    rows = await getSupportAnalytics()
  } catch {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-lg font-semibold text-[--color-on-surface]">Unable to load support data</p>
        <p className="text-sm text-[--color-on-surface-variant]">Check your database connection and try again.</p>
      </div>
    )
  }

  // Aggregate KPIs
  const totalTickets = rows.reduce((sum, r) => sum + r.tickets, 0)

  const avgCsatRows = rows.filter((r) => r.avgCsat !== null)
  const avgCsat =
    avgCsatRows.length > 0
      ? avgCsatRows.reduce((sum, r) => sum + (r.avgCsat ?? 0), 0) / avgCsatRows.length
      : null

  const avgResolutionHours =
    rows.length > 0
      ? rows.reduce((sum, r) => sum + r.avgHoursToResolve * r.tickets, 0) / Math.max(totalTickets, 1)
      : 0

  const topCategory = rows[0]

  return (
    <div className="flex flex-col gap-10 animate-fade-up">
      {/* Page header */}
      <header className="flex flex-col gap-3 border-b border-[--color-outline-variant]/40 pb-6">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[--color-on-surface-variant]">
          <span className="h-px w-8 bg-[--color-primary]" />
          <span>Support Telemetry</span>
        </div>
        <h1
          className="font-display text-[3.25rem] font-medium leading-[0.95] tracking-[-0.035em] text-[--color-on-surface]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 80, 'WONK' 0" }}
        >
          Support <span className="italic text-[--color-primary]">Analytics</span>
        </h1>
        <p className="max-w-2xl text-[16px] leading-relaxed text-[--color-on-surface-variant]">
          Ticket volume, satisfaction scores, and resolution times by category
        </p>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Total Tickets"
          value={fmtNum(totalTickets)}
          variant="default"
        />
        <KpiCard
          title="Avg Satisfaction"
          value={avgCsat !== null ? `${avgCsat.toFixed(2)} / 5` : "—"}
          variant={avgCsat !== null && avgCsat >= 4 ? "success" : avgCsat !== null && avgCsat < 3 ? "danger" : "warning"}
        />
        <KpiCard
          title="Avg Resolution"
          value={`${avgResolutionHours.toFixed(1)}h`}
          variant="default"
        />
      </div>

      {/* Top category callout */}
      {topCategory && (
        <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
          <CardHeader>
            <h2 className="font-display text-[1.5rem] font-medium leading-tight tracking-tight text-[--color-on-surface]">
              Highest Volume <span className="italic text-[--color-on-surface-variant] font-normal">Category</span>
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">Category</p>
                <p className="mt-0.5 text-2xl font-bold capitalize text-[--color-on-surface]">{topCategory.category}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">Tickets</p>
                <p className="mt-0.5 text-2xl font-bold text-[--color-on-surface]">{fmtNum(topCategory.tickets)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">Avg Resolution</p>
                <p className="mt-0.5 text-2xl font-bold text-[--color-on-surface]">{topCategory.avgHoursToResolve.toFixed(1)}h</p>
              </div>
              {topCategory.avgCsat !== null && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">Avg CSAT</p>
                  <p className="mt-0.5 text-2xl font-bold text-[--color-on-surface]">{topCategory.avgCsat.toFixed(2)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets by category table */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[--color-on-surface]">
            Tickets by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-[--color-on-surface-variant]">No support ticket data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[--color-outline-variant]">
                    <th className="pb-2 text-left font-medium text-[--color-on-surface-variant]">Category</th>
                    <th className="pb-2 text-right font-medium text-[--color-on-surface-variant]">Tickets</th>
                    <th className="pb-2 text-right font-medium text-[--color-on-surface-variant]">Avg Resolution (h)</th>
                    <th className="pb-2 text-right font-medium text-[--color-on-surface-variant]">Avg CSAT</th>
                    <th className="pb-2 text-right font-medium text-[--color-on-surface-variant]">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.category} className="border-b border-[--color-outline-variant]/40">
                      <td className="py-3 font-medium capitalize text-[--color-on-surface]">{row.category}</td>
                      <td className="py-3 text-right text-[--color-on-surface-variant]">{fmtNum(row.tickets)}</td>
                      <td className="py-3 text-right text-[--color-on-surface-variant]">{row.avgHoursToResolve.toFixed(1)}</td>
                      <td className="py-3 text-right text-[--color-on-surface-variant]">
                        {row.avgCsat !== null ? row.avgCsat.toFixed(2) : "—"}
                      </td>
                      <td className="py-3 text-right text-[--color-on-surface-variant]">
                        {totalTickets > 0 ? `${((row.tickets / totalTickets) * 100).toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category bars (visual breakdown) */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[--color-on-surface]">
            Volume Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {rows.map((row) => {
              const pct = totalTickets > 0 ? (row.tickets / totalTickets) * 100 : 0
              return (
                <div key={row.category} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium capitalize text-[--color-on-surface]">{row.category}</span>
                    <span className="text-[--color-on-surface-variant]">{fmtNum(row.tickets)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[--color-outline-variant]/30">
                    <div
                      className="h-full rounded-full bg-[--color-primary]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
