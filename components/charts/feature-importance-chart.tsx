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
import type { FeatureImportance } from "@/lib/types"

interface FeatureImportanceChartProps {
  data: FeatureImportance[]
}

interface TooltipPayload {
  value: number
  payload: FeatureImportance
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
      <p className="font-semibold text-[--color-on-surface]">{item.payload.feature}</p>
      <p className="text-[--color-on-surface-variant]">
        Importance: <span className="font-bold text-[--color-on-surface]">{(item.value * 100).toFixed(1)}%</span>
      </p>
    </div>
  )
}

function importanceColor(importance: number): string {
  if (importance >= 0.15) return "#f87171"
  if (importance >= 0.08) return "#fbbf24"
  return "#6366f1"
}

export function FeatureImportanceChart({ data }: FeatureImportanceChartProps) {
  const sorted = [...data].sort((a, b) => b.importance - a.importance).slice(0, 10)

  if (sorted.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[--color-on-surface-variant]">
        No feature importance data available
      </div>
    )
  }

  return (
    <div className="h-72 w-full">
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
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            tick={{ fontSize: 11, fill: "var(--color-on-surface-variant, #94a3b8)" }}
            axisLine={false}
            tickLine={false}
            domain={[0, "dataMax + 0.02"]}
          />
          <YAxis
            type="category"
            dataKey="feature"
            tick={{ fontSize: 11, fill: "var(--color-on-surface-variant, #94a3b8)" }}
            axisLine={false}
            tickLine={false}
            width={130}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "var(--color-surface-container-high, #1e293b)", opacity: 0.5 }}
          />
          <Bar
            dataKey="importance"
            radius={[0, 4, 4, 0]}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {sorted.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={importanceColor(entry.importance)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
