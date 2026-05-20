import { SqlExplorerClient } from "@/components/sql-explorer/sql-explorer-client"

export default function SqlExplorerPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[--color-on-surface]">
          SQL Explorer
        </h1>
        <p className="mt-1 text-sm text-[--color-on-surface-variant]">
          Run ad-hoc queries against your analytics database
        </p>
      </div>

      <SqlExplorerClient />
    </div>
  )
}
