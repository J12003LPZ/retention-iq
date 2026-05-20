import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Page header skeleton */}
      <div>
        <div className="mb-4 h-8 w-64 rounded bg-[--color-surface-container]" />
        <div className="h-4 w-96 rounded bg-[--color-surface-container]" />
      </div>

      {/* Settings sections */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="bg-[--color-surface-container] ring-[--color-outline-variant]">
          <CardHeader>
            <div className="h-4 w-40 rounded bg-[--color-surface-container-high]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-[--color-surface-container-high]" />
              <div className="h-8 w-full rounded bg-[--color-surface-container-high]" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-[--color-surface-container-high]" />
              <div className="h-8 w-full rounded bg-[--color-surface-container-high]" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
