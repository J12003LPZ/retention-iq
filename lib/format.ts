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
export function fmtDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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
