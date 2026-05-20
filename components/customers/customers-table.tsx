"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { CustomerRow } from "@/lib/types"
import type { ListOpts } from "@/lib/queries/customers.sql"
import { fmtPct, fmtMrr, fmtDate } from "@/lib/format"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ── types ──────────────────────────────────────────────────────────────────

type SortKey = NonNullable<ListOpts["sort"]>

export interface TableFilters {
  search: string
  region: string
  plan: string
  riskMin: string
  sort: SortKey
  dir: "asc" | "desc"
  page: number
}

interface CustomersTableProps {
  data: CustomerRow[]
  filters: TableFilters
  onFiltersChange: (next: Partial<TableFilters>) => void
  onRowClick: (customerId: string) => void
  pageSize?: number
}

// ── helpers ────────────────────────────────────────────────────────────────

function riskBandLabel(churnProb: number): string {
  if (churnProb >= 0.8) return "critical"
  if (churnProb >= 0.6) return "high"
  if (churnProb >= 0.3) return "moderate"
  return "safe"
}

function riskBadgeClass(churnProb: number): string {
  if (churnProb >= 0.8) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
  if (churnProb >= 0.6) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
  if (churnProb >= 0.3) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
  return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
}

function healthBadgeClass(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
  if (score >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
  if (score >= 40) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
}

const SORT_COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: "health", label: "Health" },
  { key: "churnProb", label: "Churn Risk %" },
  { key: "mrr", label: "MRR" },
  { key: "lastLogin", label: "Last Login" },
]

// ── component ──────────────────────────────────────────────────────────────

export function CustomersTable({
  data,
  filters,
  onFiltersChange,
  onRowClick,
  pageSize = 25,
}: CustomersTableProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync draft when external filters change (e.g. URL reset)
  useEffect(() => {
    setSearchDraft(filters.search)
  }, [filters.search])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setSearchDraft(val)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onFiltersChange({ search: val, page: 1 })
      }, 300)
    },
    [onFiltersChange]
  )

  const handleSort = useCallback(
    (key: SortKey) => {
      if (filters.sort === key) {
        onFiltersChange({ dir: filters.dir === "asc" ? "desc" : "asc", page: 1 })
      } else {
        onFiltersChange({ sort: key, dir: "desc", page: 1 })
      }
    },
    [filters.sort, filters.dir, onFiltersChange]
  )

  // Clear debounce timer on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (filters.sort !== col) {
      return <span className="ml-1 text-[--color-on-surface-variant] opacity-40">⇅</span>
    }
    return (
      <span className="ml-1 text-[--color-primary]">
        {filters.dir === "asc" ? "↑" : "↓"}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Input
            aria-label="Search customers by name or email"
            placeholder="Search name or email…"
            value={searchDraft}
            onChange={handleSearchChange}
            className="pr-8"
          />
        </div>

        {/* Region */}
        <Select
          value={filters.region || "_all"}
          onValueChange={(val) =>
            onFiltersChange({ region: (val ?? "") === "_all" ? "" : (val ?? ""), page: 1 })
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Regions</SelectItem>
            <SelectItem value="NA">NA</SelectItem>
            <SelectItem value="EMEA">EMEA</SelectItem>
            <SelectItem value="APAC">APAC</SelectItem>
            <SelectItem value="LATAM">LATAM</SelectItem>
          </SelectContent>
        </Select>

        {/* Plan */}
        <Select
          value={filters.plan || "_all"}
          onValueChange={(val) =>
            onFiltersChange({ plan: (val ?? "") === "_all" ? "" : (val ?? ""), page: 1 })
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Plans</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>

        {/* Risk Band */}
        <Select
          value={filters.riskMin || "_all"}
          onValueChange={(val) =>
            onFiltersChange({ riskMin: (val ?? "") === "_all" ? "" : (val ?? ""), page: 1 })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Risk Band" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Risk</SelectItem>
            <SelectItem value="0.3">Moderate+</SelectItem>
            <SelectItem value="0.6">High+</SelectItem>
            <SelectItem value="0.8">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-xl border border-[--color-outline-variant] bg-[--color-surface-container]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[--color-outline-variant] text-left text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">
              <th scope="col" className="px-4 py-3">Company</th>
              <th scope="col" className="px-4 py-3">Plan</th>
              <th scope="col" className="px-4 py-3">Region</th>
              <th
                scope="col"
                tabIndex={0}
                aria-sort={filters.sort === "mrr" ? (filters.dir === "asc" ? "ascending" : "descending") : "none"}
                className="cursor-pointer select-none whitespace-nowrap px-4 py-3 hover:text-[--color-on-surface]"
                onClick={() => handleSort("mrr")}
                onKeyDown={(e) => e.key === "Enter" && handleSort("mrr")}
              >
                MRR <SortIcon col="mrr" />
              </th>
              <th
                scope="col"
                tabIndex={0}
                aria-sort={filters.sort === "churnProb" ? (filters.dir === "asc" ? "ascending" : "descending") : "none"}
                className="cursor-pointer select-none whitespace-nowrap px-4 py-3 hover:text-[--color-on-surface]"
                onClick={() => handleSort("churnProb")}
                onKeyDown={(e) => e.key === "Enter" && handleSort("churnProb")}
              >
                Churn Risk <SortIcon col="churnProb" />
              </th>
              <th
                scope="col"
                tabIndex={0}
                aria-sort={filters.sort === "health" ? (filters.dir === "asc" ? "ascending" : "descending") : "none"}
                className="cursor-pointer select-none whitespace-nowrap px-4 py-3 hover:text-[--color-on-surface]"
                onClick={() => handleSort("health")}
                onKeyDown={(e) => e.key === "Enter" && handleSort("health")}
              >
                Health <SortIcon col="health" />
              </th>
              <th
                scope="col"
                tabIndex={0}
                aria-sort={filters.sort === "lastLogin" ? (filters.dir === "asc" ? "ascending" : "descending") : "none"}
                className="cursor-pointer select-none whitespace-nowrap px-4 py-3 hover:text-[--color-on-surface]"
                onClick={() => handleSort("lastLogin")}
                onKeyDown={(e) => e.key === "Enter" && handleSort("lastLogin")}
              >
                Last Login <SortIcon col="lastLogin" />
              </th>
              <th scope="col" className="px-4 py-3">Open Tickets</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-[--color-on-surface-variant]"
                >
                  No customers match your filters.
                </td>
              </tr>
            )}
            {data.map((row, i) => (
              <tr
                key={row.id}
                onClick={() => onRowClick(row.id)}
                className={[
                  "cursor-pointer border-b border-[--color-outline-variant] transition-colors last:border-0",
                  "hover:bg-[--color-surface-container-high]",
                  i % 2 === 0 ? "" : "bg-[--color-surface]/30",
                ].join(" ")}
              >
                {/* Company */}
                <td className="px-4 py-3">
                  <span className="font-medium text-[--color-on-surface]">
                    {row.companyName}
                  </span>
                </td>

                {/* Plan */}
                <td className="px-4 py-3 capitalize text-[--color-on-surface-variant]">
                  {row.plan}
                </td>

                {/* Region */}
                <td className="px-4 py-3 text-[--color-on-surface-variant]">
                  {row.region}
                </td>

                {/* MRR */}
                <td className="px-4 py-3 font-mono text-[--color-on-surface]">
                  {fmtMrr(row.mrrCents / 100)}
                </td>

                {/* Churn Risk */}
                <td className="px-4 py-3">
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      riskBadgeClass(row.churnProb),
                    ].join(" ")}
                  >
                    {fmtPct(row.churnProb)} · {riskBandLabel(row.churnProb)}
                  </span>
                </td>

                {/* Health */}
                <td className="px-4 py-3">
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      healthBadgeClass(row.healthScore),
                    ].join(" ")}
                  >
                    {row.healthScore}
                  </span>
                </td>

                {/* Last Login */}
                <td className="px-4 py-3 text-[--color-on-surface-variant]">
                  {row.lastLogin ? fmtDate(row.lastLogin) : "—"}
                </td>

                {/* Open Tickets */}
                <td className="px-4 py-3">
                  {row.openTickets > 0 ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                      {row.openTickets}
                    </span>
                  ) : (
                    <span className="text-[--color-on-surface-variant]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between text-sm text-[--color-on-surface-variant]">
        <span>
          Page {filters.page} · {data.length} of {pageSize} per page
        </span>
        <div className="flex gap-2">
          <button
            disabled={filters.page <= 1}
            onClick={() => onFiltersChange({ page: filters.page - 1 })}
            className="rounded-lg border border-[--color-outline-variant] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[--color-surface-container-high] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            disabled={data.length < pageSize}
            onClick={() => onFiltersChange({ page: filters.page + 1 })}
            className="rounded-lg border border-[--color-outline-variant] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[--color-surface-container-high] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
