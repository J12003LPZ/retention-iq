import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function RecommendationsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Page header skeleton */}
      <div>
        <div className="mb-4 h-8 w-64 rounded bg-[--color-surface-container]" />
        <div className="h-4 w-96 rounded bg-[--color-surface-container]" />
      </div>

      {/* Recommendations cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="bg-[--color-surface-container] ring-[--color-outline-variant]">
            <CardHeader>
              <div className="mb-2 h-4 w-32 rounded bg-[--color-surface-container-high]" />
              <div className="h-3 w-full rounded bg-[--color-surface-container-high]" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-3 w-full rounded bg-[--color-surface-container-high]" />
              <div className="h-3 w-3/4 rounded bg-[--color-surface-container-high]" />
              <div className="mt-4 h-8 w-full rounded bg-[--color-surface-container-high]" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
