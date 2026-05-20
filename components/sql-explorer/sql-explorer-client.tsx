"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// ── types ─────────────────────────────────────────────────────────────────────

interface QueryResult {
  rows: Record<string, unknown>[]
}

interface QueryError {
  error: string
}

type QueryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; rows: Record<string, unknown>[]; columns: string[] }
  | { status: "error"; message: string }

// ── helpers ───────────────────────────────────────────────────────────────────

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

// ── component ─────────────────────────────────────────────────────────────────

const STARTER_QUERY = "select * from customers limit 10"

export function SqlExplorerClient() {
  const [query, setQuery] = useState(STARTER_QUERY)
  const [state, setState] = useState<QueryState>({ status: "idle" })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const runQuery = useCallback(async () => {
    const trimmed = query.trim()
    if (!trimmed) return

    setState({ status: "loading" })

    try {
      const res = await fetch("/api/sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      })

      const data: QueryResult | QueryError = await res.json()

      if (!res.ok || "error" in data) {
        setState({
          status: "error",
          message: "error" in data ? data.error : "An unknown error occurred",
        })
        return
      }

      const rows = data.rows
      const columns =
        rows.length > 0 ? Object.keys(rows[0]) : []

      setState({ status: "success", rows, columns })
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Network error",
      })
    }
  }, [query])

  // Cmd/Ctrl+Enter shortcut
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        runQuery()
      }
    }

    textarea.addEventListener("keydown", handleKeyDown)
    return () => textarea.removeEventListener("keydown", handleKeyDown)
  }, [runQuery])

  const isLoading = state.status === "loading"

  return (
    <div className="flex flex-col gap-6">
      {/* Editor card */}
      <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[--color-on-surface]">
            Query Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={8}
            spellCheck={false}
            placeholder="Enter SQL query…"
            className={[
              "w-full resize-y rounded-lg border px-4 py-3 text-sm leading-relaxed outline-none transition",
              "bg-[--color-surface-container-high]",
              "border-[--color-outline-variant]",
              "text-[--color-on-surface]",
              "placeholder:text-[--color-on-surface-variant]",
              "focus:ring-2 focus:ring-[--color-primary]",
              "disabled:opacity-50",
            ].join(" ")}
            style={{ fontFamily: "var(--font-jbmono, var(--font-mono, monospace))" }}
            disabled={isLoading}
          />

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-[--color-on-surface-variant]">
              Press{" "}
              <kbd className="rounded border border-[--color-outline-variant] bg-[--color-surface-container-high] px-1.5 py-0.5 font-mono text-[10px]">
                ⌘ Enter
              </kbd>{" "}
              /{" "}
              <kbd className="rounded border border-[--color-outline-variant] bg-[--color-surface-container-high] px-1.5 py-0.5 font-mono text-[10px]">
                Ctrl Enter
              </kbd>{" "}
              to run
            </p>

            <button
              onClick={runQuery}
              disabled={isLoading || !query.trim()}
              className={[
                "inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition",
                "bg-[--color-primary] text-white",
                "hover:opacity-90 active:opacity-80",
                "disabled:cursor-not-allowed disabled:opacity-40",
              ].join(" ")}
            >
              {isLoading ? (
                <>
                  <span
                    aria-hidden
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
                  />
                  Running…
                </>
              ) : (
                "Run Query"
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Results area */}
      {state.status === "error" && (
        <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
          <CardContent className="pt-4">
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">
              <span className="font-semibold">Error: </span>
              {state.message}
            </div>
          </CardContent>
        </Card>
      )}

      {state.status === "success" && (
        <Card className="bg-[--color-surface-container] ring-[--color-outline-variant]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[--color-on-surface]">
              Results
              <span className="ml-2 text-sm font-normal text-[--color-on-surface-variant]">
                {state.rows.length} {state.rows.length === 1 ? "row" : "rows"} returned
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state.rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-[--color-on-surface-variant]">
                Query returned no rows.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[--color-outline-variant]">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[--color-outline-variant] bg-[--color-surface-container-high]">
                      {state.columns.map((col) => (
                        <th
                          key={col}
                          className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[--color-on-surface-variant]"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.rows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className="border-b border-[--color-outline-variant] last:border-0 odd:bg-[--color-surface-container] even:bg-[--color-surface-container-high]"
                      >
                        {state.columns.map((col) => (
                          <td
                            key={col}
                            className="max-w-xs truncate whitespace-nowrap px-4 py-2 text-[--color-on-surface]"
                            title={formatCellValue(row[col])}
                            style={{ fontFamily: "var(--font-jbmono, var(--font-mono, monospace))" }}
                          >
                            {formatCellValue(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
