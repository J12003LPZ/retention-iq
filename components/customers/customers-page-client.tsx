"use client"

import { useCallback, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { CustomerRow } from "@/lib/types"
import { CustomersTable, type TableFilters } from "./customers-table"
import { CustomerDrawer } from "./customer-drawer"

// ── helpers ────────────────────────────────────────────────────────────────

function parseFilters(sp: URLSearchParams): TableFilters {
  return {
    search: sp.get("search") ?? "",
    region: sp.get("region") ?? "",
    plan: sp.get("plan") ?? "",
    riskMin: sp.get("riskMin") ?? "",
    sort: (sp.get("sort") as TableFilters["sort"]) || "churnProb",
    dir: (sp.get("dir") as "asc" | "desc") || "desc",
    page: Math.max(1, parseInt(sp.get("page") ?? "1", 10)),
  }
}

// ── component ──────────────────────────────────────────────────────────────

interface CustomersPageClientProps {
  initialData: CustomerRow[]
  pageSize: number
}

export function CustomersPageClient({
  initialData,
  pageSize,
}: CustomersPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const filters = parseFilters(searchParams)
  const selectedCustomerId = searchParams.get("customer") ?? null

  // Merge partial filter updates into current URL params and navigate
  const handleFiltersChange = useCallback(
    (next: Partial<TableFilters>) => {
      const params = new URLSearchParams(searchParams.toString())

      if (next.search !== undefined) {
        if (next.search) params.set("search", next.search)
        else params.delete("search")
      }
      if (next.region !== undefined) {
        if (next.region) params.set("region", next.region)
        else params.delete("region")
      }
      if (next.plan !== undefined) {
        if (next.plan) params.set("plan", next.plan)
        else params.delete("plan")
      }
      if (next.riskMin !== undefined) {
        if (next.riskMin) params.set("riskMin", next.riskMin)
        else params.delete("riskMin")
      }
      if (next.sort !== undefined) params.set("sort", next.sort)
      if (next.dir !== undefined) params.set("dir", next.dir)
      if (next.page !== undefined) {
        if (next.page === 1) params.delete("page")
        else params.set("page", String(next.page))
      }

      startTransition(() => {
        router.push(`/customers?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams]
  )

  const handleRowClick = useCallback(
    (customerId: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("customer", customerId)
      startTransition(() => {
        router.push(`/customers?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams]
  )

  const handleDrawerClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("customer")
    startTransition(() => {
      router.push(`/customers?${params.toString()}`, { scroll: false })
    })
  }, [router, searchParams])

  return (
    <>
      <CustomersTable
        data={initialData}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onRowClick={handleRowClick}
        pageSize={pageSize}
      />
      <CustomerDrawer
        customerId={selectedCustomerId}
        onClose={handleDrawerClose}
      />
    </>
  )
}
