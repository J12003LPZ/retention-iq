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
import type { ChurnDriver } from "@/lib/types"

interface ChurnDriversChartProps {
  drivers: ChurnDriver[]
}

function impactColor(sharePct: number): string {
  // sharePct is 0-100 (percentage share)
  if (sharePct >= 25) return "#f87171"   // red-400  — high
  if (sharePct >= 10) return "#fbbf24"   // amber-400 — medium
  return "#4ade80"                        // green-400 — low
}

interface TooltipPayload {
  value: number
  payload: ChurnDriver
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0]
  if (!item) return null
  return (
    <div className="rounded-lg border border-[--color-outline-variant] bg-[--color-surface-container] px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-[--color-on-surface]">{item.payload.driver}</p>
      <p className="text-[--color-on-surface-variant]">
        Share: <span className="font-bold text-[--color-on-surface]">{item.value.toFixed(1)}%</span>
      </p>
    </div>
  )
}

export function ChurnDriversChart({ drivers }: ChurnDriversChartProps) {
  // Sort descending by share
  const sorted = [...drivers].sort((a, b) => b.sharePct - a.sharePct).slice(0, 8)

  if (sorted.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[--color-on-surface-variant]">
        No churn driver data available
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="var(--color-outline-variant, #334155)"
            strokeOpacity={0.4}
          />
          <XAxis
            type="number"
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            tick={{ fontSize: 11, fill: "var(--color-on-surface-variant, #94a3b8)" }}
            axisLine={false}
            tickLine={false}
            domain={[0, "dataMax + 5"]}
          />
          <YAxis
            type="category"
            dataKey="driver"
            tick={{ fontSize: 11, fill: "var(--color-on-surface-variant, #94a3b8)" }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "var(--color-surface-container-high, #1e293b)", opacity: 0.5 }}
          />
          <Bar
            dataKey="sharePct"
            radius={[0, 4, 4, 0]}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {sorted.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={impactColor(entry.sharePct)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
