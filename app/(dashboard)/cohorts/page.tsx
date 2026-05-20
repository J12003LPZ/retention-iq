import { getCohortRetention } from "@/lib/queries/cohorts.sql"
import { CohortHeatmap } from "@/components/charts/cohort-heatmap"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"

export default async function CohortAnalysisPage() {
  let cohortData: Awaited<ReturnType<typeof getCohortRetention>>

  try {
    cohortData = await getCohortRetention(12)
  } catch {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-lg font-semibold text-[--color-on-surface]">
          Unable to load cohort data
        </p>
        <p className="text-sm text-[--color-on-surface-variant]">
          Check your database connection and try again.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 animate-fade-up">
      {/* Page header */}
      <header className="flex flex-col gap-3 border-b border-[--color-outline-variant]/40 pb-6">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[--color-on-surface-variant]">
          <span className="h-px w-8 bg-[--color-primary]" />
          <span>Cohort Retention</span>
        </div>
        <h1
          className="font-display text-[3.25rem] font-medium leading-[0.95] tracking-[-0.035em] text-[--color-on-surface]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 80, 'WONK' 0" }}
        >
          Cohort <span className="italic text-[--color-primary]">Analysis</span>
        </h1>
        <p className="max-w-2xl text-[16px] leading-relaxed text-[--color-on-surface-variant]">
          Monthly retention heatmap — track how each customer cohort retains over time
        </p>
      </header>

      {/* Retention heatmap */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <h2 className="font-display text-[1.5rem] font-medium leading-tight tracking-tight text-[--color-on-surface]">
            Retention <span className="italic text-[--color-on-surface-variant] font-normal">Heatmap</span>
          </h2>
        </CardHeader>
        <CardContent>
          <CohortHeatmap data={cohortData} />
        </CardContent>
      </Card>
    </div>
  )
}
