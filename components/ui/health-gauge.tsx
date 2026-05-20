"use client"

import * as React from "react"

export interface HealthGaugeProps {
  /** Health score 0–100 */
  score: number
  /** Override the center label (defaults to the score number) */
  label?: string
  /** Diameter in px (default 160) */
  size?: number
}

/** Map a 0–100 score to a colour zone. */
function zoneColor(score: number): string {
  if (score >= 70) return "#4ade80" // green-400
  if (score >= 40) return "#facc15" // yellow-400
  return "#f87171" // red-400
}

/**
 * SVG semicircular arc gauge (180°).
 *
 * The arc is drawn on a circle whose centre is at the midpoint of the
 * bounding box.  The stroke starts at the left end (180°) and sweeps
 * clockwise to the right end (0°) — exactly half the circumference.
 */
export function HealthGauge({
  score,
  label,
  size = 160,
}: HealthGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score))
  const color = zoneColor(clampedScore)

  // Geometry
  const strokeWidth = size * 0.1
  const radius = (size - strokeWidth) / 2
  // Half circumference — the length of our 180° track
  const halfCircumference = Math.PI * radius

  // Animated progress
  const [animatedScore, setAnimatedScore] = React.useState(0)

  React.useEffect(() => {
    let start: number | null = null
    const duration = 800

    function step(timestamp: number) {
      if (start === null) start = timestamp
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(eased * clampedScore)
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }

    const raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [clampedScore])

  // strokeDashoffset: 0 = full arc, halfCircumference = empty arc
  const fillRatio = animatedScore / 100
  const dashOffset = halfCircumference * (1 - fillRatio)

  // The SVG viewBox height is size/2 + a little extra for the stroke bottom
  const viewBoxHeight = size / 2 + strokeWidth
  const cx = size / 2
  const cy = size / 2

  return (
    <div
      style={{ width: size, userSelect: "none" }}
      className="flex flex-col items-center"
      aria-label={`Health score: ${clampedScore}`}
      role="img"
    >
      <svg
        width={size}
        height={viewBoxHeight}
        viewBox={`0 0 ${size} ${viewBoxHeight}`}
        overflow="visible"
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={`${halfCircumference} ${halfCircumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(180 ${cx} ${cy})`}
          className="text-white/10"
        />

        {/* Coloured progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${halfCircumference} ${halfCircumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(180 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 ${strokeWidth * 0.6}px ${color}80)` }}
        />

        {/* Center label */}
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.22}
          fontWeight="700"
          fill={color}
          fontFamily="var(--font-display, ui-sans-serif, system-ui, sans-serif)"
        >
          {label ?? Math.round(animatedScore)}
        </text>
      </svg>

      {/* "Health Score" subtitle */}
      <p
        className="text-xs font-medium tracking-widest uppercase text-[--color-on-surface-variant] -mt-1"
        style={{ letterSpacing: "0.12em" }}
      >
        Health Score
      </p>
    </div>
  )
}
