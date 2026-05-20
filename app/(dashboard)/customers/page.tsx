import { getCustomers } from "@/lib/queries/customers.sql"
import { CustomersPageClient } from "@/components/customers/customers-page-client"
import type { ListOpts } from "@/lib/queries/customers.sql"

const PAGE_SIZE = 25

type SearchParams = { [key: string]: string | string[] | undefined }

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams

  const getString = (key: string): string | undefined => {
    const v = sp[key]
    return typeof v === "string" ? v : undefined
  }

  const opts: ListOpts = {
    search: getString("search"),
    region: getString("region"),
    plan: getString("plan"),
    riskMin: getString("riskMin") ? Number(getString("riskMin")) : undefined,
    sort: getString("sort") as ListOpts["sort"] | undefined,
    dir: getString("dir") as ListOpts["dir"] | undefined,
    page: getString("page") ? Math.max(1, parseInt(getString("page")!, 10)) : 1,
    pageSize: PAGE_SIZE,
  }

  let customers: Awaited<ReturnType<typeof getCustomers>>

  try {
    customers = await getCustomers(opts)
  } catch {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-lg font-semibold text-[--color-on-surface]">
          Unable to load customers
        </p>
        <p className="text-sm text-[--color-on-surface-variant]">
          Check your database connection and try again.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 animate-fade-up">
      {/* Page header */}
      <header className="flex flex-col gap-3 border-b border-[--color-outline-variant]/40 pb-6">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[--color-on-surface-variant]">
          <span className="h-px w-8 bg-[--color-primary]" />
          <span>Customer Roster</span>
        </div>
        <h1
          className="font-display text-[3.25rem] font-medium leading-[0.95] tracking-[-0.035em] text-[--color-on-surface]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 80, 'WONK' 0" }}
        >
          Customer <span className="italic text-[--color-primary]">Health</span>
        </h1>
        <p className="max-w-2xl text-[16px] leading-relaxed text-[--color-on-surface-variant]">
          Browse, filter, and act on at-risk accounts
        </p>
      </header>

      <CustomersPageClient initialData={customers} pageSize={PAGE_SIZE} />
    </div>
  )
}
