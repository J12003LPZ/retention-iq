"use client"

import * as React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts"
import type { RevenueRiskBand } from "@/lib/types"

interface RevenueRiskChartProps {
  data: RevenueRiskBand[]
}

const BAND_COLORS: Record<string, string> = {
  critical: "#f87171",
  high: "#fb923c",
  moderate: "#fbbf24",
  safe: "#4ade80",
}

interface TooltipPayload {
  value: number
  payload: RevenueRiskBand & { mrrDollars: number }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0]
  if (!item) return null
  const dollars = item.payload.mrrCents / 100
  const fmt =
    dollars >= 1_000_000
      ? `$${(dollars / 1_000_000).toFixed(1)}M`
      : dollars >= 1_000
      ? `$${(dollars / 1_000).toFixed(1)}K`
      : `$${Math.round(dollars)}`
  return (
    <div className="rounded-lg border border-[--color-outline-variant] bg-[--color-surface-container] px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold capitalize text-[--color-on-surface]">{item.payload.band}</p>
      <p className="text-[--color-on-surface-variant]">
        MRR at risk: <span className="font-bold text-[--color-on-surface]">{fmt}</span>
      </p>
      <p className="text-[--color-on-surface-variant]">
        Customers: <span className="font-bold text-[--color-on-surface]">{item.payload.customers.toLocaleString()}</span>
      </p>
    </div>
  )
}

const BAND_ORDER = ["critical", "high", "moderate", "safe"]

export function RevenueRiskChart({ data }: RevenueRiskChartProps) {
  const sorted = [...data].sort(
    (a, b) => BAND_ORDER.indexOf(a.band) - BAND_ORDER.indexOf(b.band)
  )

  if (sorted.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[--color-on-surface-variant]">
        No revenue risk data available
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="var(--color-outline-variant, #334155)"
            strokeOpacity={0.4}
          />
          <XAxis
            type="number"
            tickFormatter={(v: number) => {
              const d = v / 100
              return d >= 1_000_000
                ? `$${(d / 1_000_000).toFixed(1)}M`
                : d >= 1_000
                ? `$${(d / 1_000).toFixed(0)}K`
                : `$${Math.round(d)}`
            }}
            tick={{ fontSize: 11, fill: "var(--color-on-surface-variant, #94a3b8)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="band"
            tick={{ fontSize: 12, fill: "var(--color-on-surface-variant, #94a3b8)" }}
            axisLine={false}
            tickLine={false}
            width={70}
            tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "var(--color-surface-container-high, #1e293b)", opacity: 0.5 }}
          />
          <Bar
            dataKey="mrrCents"
            radius={[0, 4, 4, 0]}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {sorted.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={BAND_COLORS[entry.band] ?? "#6366f1"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
