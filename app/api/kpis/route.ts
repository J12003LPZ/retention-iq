import { NextResponse } from "next/server";
import { getKpiSummary } from "@/lib/queries/kpis.sql";

export const revalidate = 60;

export async function GET(req: Request) {
  const days = Number(new URL(req.url).searchParams.get("days") ?? "30");
  const data = await getKpiSummary(Number.isFinite(days) ? days : 30);
  return NextResponse.json(data);
}
