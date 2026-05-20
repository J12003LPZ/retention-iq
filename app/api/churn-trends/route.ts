import { NextResponse } from "next/server";
import { getChurnTrend, getChurnDrivers } from "@/lib/queries/churn.sql";

export const revalidate = 60;

export async function GET(req: Request) {
  const g = (new URL(req.url).searchParams.get("granularity") ?? "weekly") as
    "daily" | "weekly" | "monthly";
  const [trend, drivers] = await Promise.all([getChurnTrend(g), getChurnDrivers()]);
  return NextResponse.json({ trend, drivers });
}
