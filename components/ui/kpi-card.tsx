"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { fmtTrend } from "@/lib/format"

export interface KpiCardProps {
  title: string
  /** Pre-formatted value string, e.g. "$1.2M" or "23.4%" */
  value: string
  /** Raw fraction, e.g. 0.05 = +5%. Shown as a trend badge when provided. */
  trend?: number
  /** Contextual label shown next to the trend badge, e.g. "vs last 30d" */
  trendLabel?: string
  /** Optional icon rendered in the top-right corner */
  icon?: React.ReactNode
  /**
   * Controls sentiment colouring of the trend badge.
   * - "default"  — positive trend = green, negative = red
   * - "danger"   — inverted; positive = red, negative = green (e.g. churn rate)
   * - "warning"  — amber accent regardless of direction
   * - "success"  — green accent regardless of direction
   */
  variant?: "default" | "danger" | "warning" | "success"
}

function trendBadgeClasses(trend: number, variant: KpiCardProps["variant"]): string {
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"

  if (variant === "warning") return cn(base, "bg-amber-500/15 text-amber-300")
  if (variant === "success") return cn(base, "bg-emerald-500/15 text-emerald-300")

  const isPositive = trend >= 0
  const goodColor = "bg-emerald-500/15 text-emerald-300"
  const badColor = "bg-rose-500/15 text-rose-300"
  if (variant === "danger") return cn(base, isPositive ? badColor : goodColor)
  return cn(base, isPositive ? goodColor : badColor)
}

export function KpiCard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  variant = "default",
}: KpiCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[--color-outline-variant]/60 bg-gradient-to-b from-[--color-surface-container] to-[--color-surface-container-low] p-6 transition-all hover:border-[--color-primary]/30 hover:from-[--color-surface-container-high]">
      {/* corner accent */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[--color-primary]/[0.04] blur-2xl transition-opacity group-hover:opacity-100 opacity-50" />

      <div className="relative flex flex-col gap-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[--color-on-surface-variant]">
            {title}
          </p>
          {icon != null && (
            <span className="shrink-0 text-[--color-primary] opacity-80">{icon}</span>
          )}
        </div>

        {/* Value — Fraunces serif for editorial weight */}
        <p
          className="font-display text-[2.75rem] font-medium leading-[0.95] tracking-tight text-[--color-on-surface] tabular-nums"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50, 'WONK' 0" }}
        >
          {value}
        </p>

        {/* Trend row */}
        {trend != null && (
          <div className="flex items-center gap-2 pt-1">
            <span className={trendBadgeClasses(trend, variant)}>
              {trend >= 0 ? "↑" : "↓"} {fmtTrend(trend).replace(/^[+-]/, "")}
            </span>
            {trendLabel != null && (
              <span className="text-xs text-[--color-on-surface-variant]">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
