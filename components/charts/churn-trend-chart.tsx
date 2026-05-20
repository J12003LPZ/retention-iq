"use client"

import * as React from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { ChurnTrendPoint } from "@/lib/types"

export type Granularity = "daily" | "weekly" | "monthly"

interface ChurnTrendChartProps {
  initialData: ChurnTrendPoint[]
  initialGranularity?: Granularity
}

function formatXLabel(date: string, granularity: Granularity): string {
  // date is "YYYY-MM-DD"
  const d = new Date(date + "T00:00:00Z")
  if (granularity === "monthly") {
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
}

interface TooltipPayload {
  value: number
  payload: ChurnTrendPoint
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  granularity: Granularity
}

function CustomTooltip({ active, payload, label, granularity }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]
  if (!point) return null
  return (
    <div className="rounded-lg border border-[--color-outline-variant] bg-[--color-surface-container] px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-[--color-on-surface]">
        {label ? formatXLabel(label, granularity) : ""}
      </p>
      <p className="text-[--color-primary]">
        Churn: <span className="font-bold">{point.value.toFixed(2)}%</span>
      </p>
      <p className="text-[--color-on-surface-variant]">
        Churned: {point.payload.churnedCount.toLocaleString()}
      </p>
      <p className="text-[--color-on-surface-variant]">
        Active: {point.payload.activeCount.toLocaleString()}
      </p>
    </div>
  )
}

const GRANULARITY_LABELS: Record<Granularity, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
}

export function ChurnTrendChart({ initialData, initialGranularity = "weekly" }: ChurnTrendChartProps) {
  const [granularity, setGranularity] = React.useState<Granularity>(initialGranularity)
  const [data, setData] = React.useState<ChurnTrendPoint[]>(initialData)
  const [loading, setLoading] = React.useState(false)

  const fetchData = React.useCallback(async (g: Granularity) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/churn-trends?granularity=${g === "daily" ? "day" : g === "weekly" ? "week" : "month"}`)
      if (res.ok) {
        const json = await res.json() as { trend: ChurnTrendPoint[]; drivers: unknown[] }
        setData(json.trend)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleGranularityChange = (g: Granularity) => {
    setGranularity(g)
    void fetchData(g)
  }

  const xLabels = data.map((d) => formatXLabel(d.date, granularity))

  return (
    <div className="flex flex-col gap-4">
      {/* Granularity toggle */}
      <div className="flex items-center justify-end gap-1">
        {(["daily", "weekly", "monthly"] as Granularity[]).map((g) => (
          <button
            key={g}
            onClick={() => handleGranularityChange(g)}
            className={[
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              granularity === g
                ? "bg-[--color-primary] text-[--color-on-primary]"
                : "text-[--color-on-surface-variant] hover:bg-[--color-surface-container-high]",
            ].join(" ")}
          >
            {GRANULARITY_LABELS[g]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className={`h-64 w-full transition-opacity duration-300 ${loading ? "opacity-50" : "opacity-100"}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="churnGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant, #334155)" strokeOpacity={0.4} />
            <XAxis
              dataKey="date"
              tickFormatter={(val: string) => formatXLabel(val, granularity)}
              tick={{ fontSize: 11, fill: "var(--color-on-surface-variant, #94a3b8)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(val: number) => `${val.toFixed(1)}%`}
              tick={{ fontSize: 11, fill: "var(--color-on-surface-variant, #94a3b8)" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              content={<CustomTooltip granularity={granularity} />}
              cursor={{ stroke: "var(--color-primary, #6366f1)", strokeWidth: 1, strokeDasharray: "4 2" }}
            />
            <Area
              type="monotone"
              dataKey="churnPct"
              stroke="var(--color-primary, #6366f1)"
              strokeWidth={2}
              fill="url(#churnGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--color-primary, #6366f1)", stroke: "var(--color-surface, #0f172a)", strokeWidth: 2 }}
              isAnimationActive={true}
              animationDuration={700}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* X-axis label count hint */}
      {xLabels.length > 0 && (
        <p className="text-right text-xs text-[--color-on-surface-variant] opacity-60">
          {xLabels.length} data points
        </p>
      )}
    </div>
  )
}
