import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SqlExplorerLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Page header skeleton */}
      <div>
        <div className="mb-4 h-8 w-64 rounded bg-[--color-surface-container]" />
        <div className="h-4 w-96 rounded bg-[--color-surface-container]" />
      </div>

      {/* Editor area skeleton */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader className="pb-2">
          <div className="h-4 w-32 rounded bg-[--color-surface-container-high]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2 rounded bg-[--color-surface-container-high] p-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-full rounded bg-[--color-surface-container]" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Execute button skeleton */}
      <div className="h-10 w-32 rounded bg-[--color-surface-container]" />

      {/* Results area skeleton */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <div className="h-4 w-40 rounded bg-[--color-surface-container-high]" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
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
