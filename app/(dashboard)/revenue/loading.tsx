import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function RevenueLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Page header skeleton */}
      <div>
        <div className="mb-4 h-8 w-64 rounded bg-[--color-surface-container]" />
        <div className="h-4 w-96 rounded bg-[--color-surface-container]" />
      </div>

      {/* KPI cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-[--color-surface-container] ring-[--color-outline-variant]">
            <CardHeader className="pb-1">
              <div className="h-3 w-24 rounded bg-[--color-surface-container-high]" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="h-8 w-32 rounded bg-[--color-surface-container-high]" />
              <div className="h-3 w-20 rounded bg-[--color-surface-container-high]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart skeleton */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <div className="h-4 w-40 rounded bg-[--color-surface-container-high]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded bg-[--color-surface-container-high]" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
