import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function PredictionsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Page header skeleton */}
      <div>
        <div className="mb-4 h-8 w-64 rounded bg-[--color-surface-container]" />
        <div className="h-4 w-96 rounded bg-[--color-surface-container]" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-[--color-surface-container] ring-[--color-outline-variant]">
            <CardHeader>
              <div className="h-4 w-40 rounded bg-[--color-surface-container-high]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-10 rounded bg-[--color-surface-container-high]" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <div className="h-4 w-40 rounded bg-[--color-surface-container-high]" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 border-t border-[--color-outline-variant] pt-3">
              <div className="h-4 flex-1 rounded bg-[--color-surface-container-high]" />
              <div className="h-4 w-20 rounded bg-[--color-surface-container-high]" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
