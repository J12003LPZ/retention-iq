import { NextResponse } from "next/server";
import { sqlReadonly } from "@/lib/db";

export const dynamic = "force-dynamic";

const FORBIDDEN = /\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|copy|vacuum|analyze|cluster|reindex|do)\b/i;
const MAX_ROWS = 500;
const TIMEOUT_MS = 5000;

export async function POST(req: Request) {
  if (!sqlReadonly) {
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

  const safe = `select * from (${query}) _ limit ${MAX_ROWS}`;
  const start = Date.now();
  try {
    const rows = (await Promise.race([
      sqlReadonly!.unsafe(safe),
      new Promise((_, rej) => setTimeout(() => rej(new Error("query timeout")), TIMEOUT_MS)),
    ])) as unknown as Record<string, unknown>[];
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
