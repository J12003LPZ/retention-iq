"use client"

import { useEffect, useState } from "react"
import { XIcon } from "lucide-react"
import { fmtPct, fmtMrr, fmtDate } from "@/lib/format"

// ── API response types ─────────────────────────────────────────────────────

interface TicketRow {
  id: string
  opened_at: string
  resolved_at: string | null
  severity: "low" | "medium" | "high" | "critical"
  category: string
  satisfaction: number | null
}

interface PaymentRow {
  id: string
  amount_cents: number
  status: "paid" | "failed" | "pending" | string
  paid_at: string | null
}

interface CustomerDetail {
  id: string
  company_name: string
  email: string
  region: string
  joined_at: string | null
  // from lateral join
  plan_id: string | null
  mrr_cents: number | null
  churn_prob: number | null
  top_factors: unknown
  // joined arrays
  tickets: TicketRow[]
  payments: PaymentRow[]
  usage: Array<{ week: string; total: number }>
}

// ── helpers ────────────────────────────────────────────────────────────────

function severityClass(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    default:
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
  }
}

function paymentStatusClass(status: string): string {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    default:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
  }
}

function churnBarClass(prob: number): string {
  if (prob >= 0.8) return "bg-red-500"
  if (prob >= 0.6) return "bg-orange-500"
  if (prob >= 0.3) return "bg-yellow-500"
  return "bg-green-500"
}

// ── component ──────────────────────────────────────────────────────────────

interface CustomerDrawerProps {
  customerId: string | null
  onClose: () => void
}

export function CustomerDrawer({ customerId, onClose }: CustomerDrawerProps) {
  const [data, setData] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!customerId) {
      setData(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setData(null)

    fetch(`/api/customers/${encodeURIComponent(customerId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }
        return res.json() as Promise<CustomerDetail>
      })
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unknown error")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [customerId])

  // Not open
  if (!customerId) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-hidden border-l border-[--color-outline-variant] bg-[--color-surface-container] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[--color-outline-variant] px-5 py-4">
          <h2 className="text-base font-semibold text-[--color-on-surface]">
            Customer Detail
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[--color-on-surface-variant] transition-colors hover:bg-[--color-surface-container-high] hover:text-[--color-on-surface]"
            aria-label="Close drawer"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex h-40 items-center justify-center text-sm text-[--color-on-surface-variant]">
              Loading…
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              Failed to load customer: {error}
            </div>
          )}

          {data && !loading && (
            <div className="flex flex-col gap-6">
              {/* ── Identity ── */}
              <section className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-[--color-on-surface]">
                  {data.company_name}
                </h3>
                <p className="text-sm text-[--color-on-surface-variant]">
                  {data.email}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-[--color-surface-container-high] px-2.5 py-1 font-medium capitalize text-[--color-on-surface]">
                    {data.plan_id ?? "—"}
                  </span>
                  <span className="rounded-full bg-[--color-surface-container-high] px-2.5 py-1 font-medium text-[--color-on-surface]">
                    {data.region}
                  </span>
                </div>
              </section>

              {/* ── Key metrics ── */}
              <section className="grid grid-cols-2 gap-3">
                <Metric
                  label="MRR"
                  value={data.mrr_cents != null ? fmtMrr(data.mrr_cents / 100) : "—"}
                />
                <Metric
                  label="Joined"
                  value={data.joined_at ? fmtDate(data.joined_at) : "—"}
                />
              </section>

              {/* ── Churn probability ── */}
              <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">
                  <span>Churn Probability</span>
                  <span className="text-[--color-on-surface]">
                    {data.churn_prob != null ? fmtPct(data.churn_prob) : "—"}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[--color-surface-container-high]">
                  <div
                    className={[
                      "h-full rounded-full transition-all",
                      churnBarClass(data.churn_prob ?? 0),
                    ].join(" ")}
                    style={{ width: `${(data.churn_prob ?? 0) * 100}%` }}
                  />
                </div>
              </section>

              {/* ── Support tickets ── */}
              <section className="flex flex-col gap-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[--color-on-surface-variant]">
                  Support Tickets
                  {data.tickets.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-[--color-surface-container-high] px-1.5 py-0.5 text-[10px]">
                      {data.tickets.length}
                    </span>
                  )}
                </h4>
                {data.tickets.length === 0 ? (
                  <p className="text-sm text-[--color-on-surface-variant]">No tickets.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {data.tickets.slice(0, 8).map((t) => (
                      <li
                        key={t.id}
                        className="flex items-start justify-between gap-3 rounded-lg bg-[--color-surface-container-high] px-3 py-2.5 text-sm"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium capitalize text-[--color-on-surface]">
                            {t.category}
                          </span>
                          <span className="text-xs text-[--color-on-surface-variant]">
                            {fmtDate(t.opened_at)} ·{" "}
                            {t.resolved_at ? (
                              <span className="text-green-600 dark:text-green-400">
                                Resolved
                              </span>
                            ) : (
                              <span className="text-orange-600 dark:text-orange-400">
                                Open
                              </span>
                            )}
                          </span>
                        </div>
                        <span
                          className={[
                            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                            severityClass(t.severity),
                          ].join(" ")}
                        >
                          {t.severity}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── Recent payments ── */}
              <section className="flex flex-col gap-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[--color-on-surface-variant]">
                  Recent Payments
                </h4>
                {data.payments.length === 0 ? (
                  <p className="text-sm text-[--color-on-surface-variant]">No payments.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {data.payments.slice(0, 3).map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-[--color-surface-container-high] px-3 py-2.5 text-sm"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-[--color-on-surface]">
                            {fmtMrr(p.amount_cents / 100)}
                          </span>
                          <span className="text-xs text-[--color-on-surface-variant]">
                            {p.paid_at ? fmtDate(p.paid_at) : "—"}
                          </span>
                        </div>
                        <span
                          className={[
                            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                            paymentStatusClass(p.status),
                          ].join(" ")}
                        >
                          {p.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

// ── sub-components ─────────────────────────────────────────────────────────

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-[--color-surface-container-high] px-3 py-2.5">
      <span className="text-xs font-medium uppercase tracking-wide text-[--color-on-surface-variant]">
        {label}
      </span>
      <span className="text-base font-bold text-[--color-on-surface]">{value}</span>
    </div>
  )
}
