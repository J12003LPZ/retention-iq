"use client"

import * as React from "react"
import type { CohortCell } from "@/lib/types"
import { fmtNum } from "@/lib/format"

interface CohortHeatmapProps {
  data: CohortCell[]
}

/** Returns a Tailwind bg class based on retention percentage (0–100). */
function retentionBgClass(pct: number, isOrigin: boolean): string {
  if (isOrigin) return "bg-[#1e3a5f]" // deep blue for month-0 baseline
  if (pct >= 80) return "bg-[#166534]"
  if (pct >= 60) return "bg-[#15803d]"
  if (pct >= 40) return "bg-[#ca8a04]"
  if (pct >= 20) return "bg-[#c2410c]"
  return "bg-[#991b1b]"
}

function retentionTextClass(pct: number, isOrigin: boolean): string {
  if (isOrigin) return "text-blue-200"
  if (pct >= 40) return "text-white"
  return "text-white"
}

/** Format "2024-01" → "Jan 2024" */
function fmtCohortMonth(ym: string): string {
  const [year, month] = ym.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

interface TooltipState {
  cohortMonth: string
  monthIndex: number
  retentionPct: number
  cohortSize: number
  x: number
  y: number
}

export function CohortHeatmap({ data }: CohortHeatmapProps) {
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null)

  // Build a sorted list of unique cohort months (rows)
  const cohortMonths = React.useMemo(() => {
    const months = [...new Set(data.map((d) => d.cohortMonth))]
    return months.sort()
  }, [data])

  // Build a sorted list of unique month indices (columns)
  const monthIndices = React.useMemo(() => {
    const indices = [...new Set(data.map((d) => d.monthIndex))]
    return indices.sort((a, b) => a - b)
  }, [data])

  // Build a lookup map: "cohortMonth|monthIndex" → CohortCell
  const cellMap = React.useMemo(() => {
    const map = new Map<string, CohortCell>()
    for (const cell of data) {
      map.set(`${cell.cohortMonth}|${cell.monthIndex}`, cell)
    }
    return map
  }, [data])

  // Get cohort size for each cohort (from month 0 row)
  const cohortSizes = React.useMemo(() => {
    const sizes = new Map<string, number>()
    for (const cell of data) {
      if (cell.monthIndex === 0) {
        sizes.set(cell.cohortMonth, cell.cohortSize)
      }
    }
    return sizes
  }, [data])

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLTableCellElement>,
    cell: CohortCell,
  ) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      cohortMonth: cell.cohortMonth,
      monthIndex: cell.monthIndex,
      retentionPct: cell.retentionPct,
      cohortSize: cell.cohortSize,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    })
  }

  const handleMouseLeave = () => setTooltip(null)

  if (cohortMonths.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[--color-on-surface-variant]">
        No cohort data available.
      </p>
    )
  }

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-separate border-spacing-0.5 text-xs">
        <thead>
          <tr>
            {/* Row label header */}
            <th className="sticky left-0 z-10 min-w-[100px] bg-[--color-surface-container] px-3 py-2 text-left font-medium text-[--color-on-surface-variant]">
              Cohort
            </th>
            <th className="min-w-[56px] px-2 py-2 text-center font-medium text-[--color-on-surface-variant]">
              Size
            </th>
            {monthIndices.map((idx) => (
              <th
                key={idx}
                className="min-w-[52px] px-1 py-2 text-center font-medium text-[--color-on-surface-variant]"
              >
                M+{idx}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohortMonths.map((cohortMonth) => {
            const size = cohortSizes.get(cohortMonth) ?? 0
            return (
              <tr key={cohortMonth}>
                {/* Cohort label */}
                <td className="sticky left-0 z-10 bg-[--color-surface-container] px-3 py-1 font-medium text-[--color-on-surface] whitespace-nowrap">
                  {fmtCohortMonth(cohortMonth)}
                </td>
                {/* Cohort size */}
                <td className="px-2 py-1 text-center text-[--color-on-surface-variant]">
                  {fmtNum(size)}
                </td>
                {/* Retention cells */}
                {monthIndices.map((idx) => {
                  const cell = cellMap.get(`${cohortMonth}|${idx}`)
                  if (!cell) {
                    return (
                      <td
                        key={idx}
                        className="h-9 min-w-[52px] rounded bg-[--color-surface-container] opacity-30"
                      />
                    )
                  }
                  const isOrigin = idx === 0
                  const bgClass = retentionBgClass(cell.retentionPct, isOrigin)
                  const txtClass = retentionTextClass(cell.retentionPct, isOrigin)
                  return (
                    <td
                      key={idx}
                      className={[
                        "h-9 min-w-[52px] cursor-default rounded px-1 py-0.5 text-center font-semibold transition-opacity hover:opacity-80",
                        bgClass,
                        txtClass,
                      ].join(" ")}
                      onMouseEnter={(e) => handleMouseEnter(e, cell)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {cell.retentionPct.toFixed(0)}%
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[--color-on-surface-variant]">
        <span className="font-medium">Retention:</span>
        {[
          { label: "≥80%", color: "#166534" },
          { label: "≥60%", color: "#15803d" },
          { label: "≥40%", color: "#ca8a04" },
          { label: "≥20%", color: "#c2410c" },
          { label: "<20%", color: "#991b1b" },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-5 rounded"
              style={{ backgroundColor: color }}
            />
            {label}
          </span>
        ))}
      </div>

      {/* Floating tooltip (fixed position relative to viewport) */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-[--color-outline-variant] bg-[--color-surface-container] px-3 py-2 text-xs shadow-xl"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-semibold text-[--color-on-surface]">
            {fmtCohortMonth(tooltip.cohortMonth)} — Month {tooltip.monthIndex}
          </p>
          <p className="mt-0.5 text-[--color-primary]">
            Retention: <span className="font-bold">{tooltip.retentionPct.toFixed(1)}%</span>
          </p>
          <p className="text-[--color-on-surface-variant]">
            Retained: {fmtNum(Math.round((tooltip.retentionPct / 100) * tooltip.cohortSize))}
            {" / "}
            {fmtNum(tooltip.cohortSize)}
          </p>
        </div>
      )}
    </div>
  )
}
