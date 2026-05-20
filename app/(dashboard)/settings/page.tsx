import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-10 animate-fade-up">
      <header className="flex flex-col gap-3 border-b border-[--color-outline-variant]/40 pb-6">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[--color-on-surface-variant]">
          <span className="h-px w-8 bg-[--color-primary]" />
          <span>Workspace</span>
        </div>
        <h1
          className="font-display text-[3.25rem] font-medium leading-[0.95] tracking-[-0.035em] text-[--color-on-surface]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 80, 'WONK' 0" }}
        >
          Workspace <span className="italic text-[--color-primary]">Settings</span>
        </h1>
        <p className="max-w-2xl text-[16px] leading-relaxed text-[--color-on-surface-variant]">
          Manage your workspace configuration
        </p>
      </header>

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
