"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { fmtTrend } from "@/lib/format"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
   * - "danger"   — inverted; positive trend = red, negative = green (e.g. churn rate)
   * - "warning"  — amber accent regardless of direction
   * - "success"  — green accent regardless of direction
   */
  variant?: "default" | "danger" | "warning" | "success"
}

function trendBadgeClasses(
  trend: number,
  variant: KpiCardProps["variant"]
): string {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"

  if (variant === "warning") {
    return cn(base, "bg-amber-500/15 text-amber-400")
  }
  if (variant === "success") {
    return cn(base, "bg-emerald-500/15 text-emerald-400")
  }

  const isPositive = trend >= 0

  // For "danger" variant (e.g. churn rate), positive = bad, negative = good
  const goodColor = "bg-emerald-500/15 text-emerald-400"
  const badColor = "bg-red-500/15 text-red-400"

  if (variant === "danger") {
    return cn(base, isPositive ? badColor : goodColor)
  }

  // default
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
    <Card className="bg-[--color-surface-container] ring-[--color-outline-variant] text-[--color-on-surface]">
      <CardHeader className="pb-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium text-[--color-on-surface-variant] tracking-wide uppercase">
            {title}
          </CardTitle>
          {icon != null && (
            <span className="shrink-0 text-[--color-primary] mt-0.5">{icon}</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold font-display tracking-tight leading-none">
          {value}
        </p>
        {trend != null && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className={trendBadgeClasses(trend, variant)}>
              {fmtTrend(trend)}
            </span>
            {trendLabel != null && (
              <span className="text-xs text-[--color-on-surface-variant]">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
