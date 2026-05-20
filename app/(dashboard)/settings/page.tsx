import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[--color-on-surface]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[--color-on-surface-variant]">
          Manage your workspace configuration
        </p>
      </div>

      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[--color-on-surface]">
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[--color-on-surface-variant]">
            Settings configuration will be available in a future release.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
