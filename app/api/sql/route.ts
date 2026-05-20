import { NextResponse } from "next/server";
import { sqlReadonly, isReadonlyConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

const FORBIDDEN = /\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|copy|vacuum|analyze|cluster|reindex|do)\b/i;
const MAX_ROWS = 500;

export async function POST(req: Request) {
  if (!isReadonlyConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL_READONLY not configured" }, { status: 503 });
  }
  const { query } = (await req.json()) as { query?: string };
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }
  if (query.length > 4000) {
    return NextResponse.json({ error: "query too long" }, { status: 400 });
  }
  if (FORBIDDEN.test(query)) {
    return NextResponse.json({ error: "only SELECT queries are permitted" }, { status: 400 });
  }
  if (!/^\s*(with|select)\b/i.test(query)) {
    return NextResponse.json({ error: "query must start with SELECT or WITH" }, { status: 400 });
  }

  // Wrap user query in an outer SELECT to cap row count. statement_timeout is
  // enforced on the read-only role at the database level (set via Neon Console
  // or `ALTER ROLE retentioniq_ro SET statement_timeout = '5s'`), since the
  // Neon HTTP driver only supports single-statement requests.
  const safe = `select * from (${query}) _ limit ${MAX_ROWS}`;
  const start = Date.now();
  try {
    const result = (await sqlReadonly!.query(safe)) as unknown;
    const rows = Array.isArray(result) ? (result as Record<string, unknown>[]) : [];
    return NextResponse.json({
      rows,
      rowCount: rows.length,
      truncated: rows.length === MAX_ROWS,
      durationMs: Date.now() - start,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "query failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
