import { SqlExplorerClient } from "@/components/sql-explorer/sql-explorer-client"

export default function SqlExplorerPage() {
  return (
    <div className="flex flex-col gap-10 animate-fade-up">
      {/* Page header */}
      <header className="flex flex-col gap-3 border-b border-[--color-outline-variant]/40 pb-6">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[--color-on-surface-variant]">
          <span className="h-px w-8 bg-[--color-primary]" />
          <span>Query Console</span>
        </div>
        <h1
          className="font-display text-[3.25rem] font-medium leading-[0.95] tracking-[-0.035em] text-[--color-on-surface]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 80, 'WONK' 0" }}
        >
          SQL <span className="italic text-[--color-primary]">Explorer</span>
        </h1>
        <p className="max-w-2xl text-[16px] leading-relaxed text-[--color-on-surface-variant]">
          Run ad-hoc queries against your analytics database
        </p>
      </header>

      <SqlExplorerClient />
    </div>
  )
}
