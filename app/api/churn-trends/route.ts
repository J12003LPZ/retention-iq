import { NextResponse } from "next/server";
import { getChurnTrend, getChurnDrivers } from "@/lib/queries/churn.sql";

export const revalidate = 60;

const VALID_GRANULARITIES = ["daily", "weekly", "monthly"] as const;
type Granularity = typeof VALID_GRANULARITIES[number];

export async function GET(req: Request) {
  try {
    const raw = new URL(req.url).searchParams.get("granularity") ?? "weekly";
    if (!(VALID_GRANULARITIES as readonly string[]).includes(raw)) {
      return NextResponse.json({ error: "granularity must be daily, weekly, or monthly" }, { status: 400 });
    }
    const g = raw as Granularity;
    const [trend, drivers] = await Promise.all([getChurnTrend(g), getChurnDrivers()]);
    return NextResponse.json({ trend, drivers });
  } catch {
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
