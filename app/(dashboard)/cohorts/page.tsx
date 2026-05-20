import { getCohortRetention } from "@/lib/queries/cohorts.sql"
import { CohortHeatmap } from "@/components/charts/cohort-heatmap"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[--color-on-surface]">
          Cohort Analysis
        </h1>
        <p className="mt-1 text-sm text-[--color-on-surface-variant]">
          Monthly retention heatmap — track how each customer cohort retains over time
        </p>
      </div>

      {/* Retention heatmap */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[--color-on-surface]">
            Retention Heatmap (12-month window)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CohortHeatmap data={cohortData} />
        </CardContent>
      </Card>
    </div>
  )
}
