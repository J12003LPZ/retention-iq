"use client"

import * as React from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { RiskBand } from "@/lib/types"

interface RiskSegment {
  band: RiskBand
  customers: number
  mrrCents: number
}

interface RiskSegmentsChartProps {
  data: RiskSegment[]
}

const BAND_COLORS: Record<string, string> = {
  critical: "#f87171",
  high: "#fb923c",
  moderate: "#fbbf24",
  safe: "#4ade80",
}

interface TooltipPayload {
  value: number
  payload: RiskSegment
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
      <p className="font-semibold capitalize text-[--color-on-surface]">{item.payload.band}</p>
      <p className="text-[--color-on-surface-variant]">
        Customers: <span className="font-bold text-[--color-on-surface]">{item.value.toLocaleString()}</span>
      </p>
    </div>
  )
}

const BAND_ORDER = ["critical", "high", "moderate", "safe"]

export function RiskSegmentsChart({ data }: RiskSegmentsChartProps) {
  const sorted = [...data].sort(
    (a, b) => BAND_ORDER.indexOf(a.band) - BAND_ORDER.indexOf(b.band)
  )

  if (sorted.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[--color-on-surface-variant]">
        No risk segment data available
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={sorted}
            dataKey="customers"
            nameKey="band"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            isAnimationActive={true}
            animationDuration={800}
          >
            {sorted.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={BAND_COLORS[entry.band] ?? "#6366f1"}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => (
              <span style={{ color: "var(--color-on-surface-variant, #94a3b8)", fontSize: 12, textTransform: "capitalize" }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
