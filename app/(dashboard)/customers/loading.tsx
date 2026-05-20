import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function CustomersLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Page header skeleton */}
      <div>
        <div className="mb-4 h-8 w-64 rounded bg-[--color-surface-container]" />
        <div className="h-4 w-96 rounded bg-[--color-surface-container]" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-48 rounded bg-[--color-surface-container]" />
        <div className="h-10 w-32 rounded bg-[--color-surface-container]" />
        <div className="h-10 w-32 rounded bg-[--color-surface-container]" />
      </div>

      {/* Table skeleton */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <div className="flex gap-4">
            <div className="h-4 flex-1 rounded bg-[--color-surface-container-high]" />
            <div className="h-4 w-20 rounded bg-[--color-surface-container-high]" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 border-t border-[--color-outline-variant] pt-3">
              <div className="h-4 flex-1 rounded bg-[--color-surface-container-high]" />
              <div className="h-4 w-20 rounded bg-[--color-surface-container-high]" />
              <div className="h-4 w-16 rounded bg-[--color-surface-container-high]" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pagination skeleton */}
      <div className="flex justify-between">
        <div className="h-4 w-32 rounded bg-[--color-surface-container]" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-8 rounded bg-[--color-surface-container]" />
          ))}
        </div>
      </div>
    </div>
  )
}
