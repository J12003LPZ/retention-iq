/**
 * Formatting utilities for numbers, currency, dates, and trend values.
 */

/**
 * Format a fraction as a percentage string.
 * @example fmtPct(0.2341) → "23.4%"
 */
export function fmtPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format a dollar amount with M/K suffix for large values.
 * @example fmtMrr(1234567) → "$1.2M"
 * @example fmtMrr(12345)   → "$12.3K"
 * @example fmtMrr(999)     → "$999"
 */
export function fmtMrr(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`
  }
  return `$${Math.round(value)}`
}

/**
 * Format a number with comma separators.
 * @example fmtNum(12345) → "12,345"
 */
export function fmtNum(value: number): string {
  return value.toLocaleString("en-US")
}

/**
 * Format an ISO date string as a human-readable date.
 * @example fmtDate("2024-01-15T...") → "Jan 15, 2024"
 */
export function fmtDate(iso: string | Date | null | undefined): string {
  if (iso == null) return "—"
  // Accept Date objects (from DB drivers), or ISO strings (with or without time)
  const date =
    iso instanceof Date
      ? iso
      : new Date(typeof iso === "string" && !iso.includes("T") ? iso + "T00:00:00Z" : iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

/**
 * Format a fractional trend value, always including the sign.
 * @example fmtTrend(0.05)  → "+5.0%"
 * @example fmtTrend(-0.02) → "-2.0%"
 */
export function fmtTrend(value: number): string {
  const pct = (value * 100).toFixed(1)
  return value >= 0 ? `+${pct}%` : `${pct}%`
}
