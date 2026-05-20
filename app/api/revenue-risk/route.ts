import { NextResponse } from "next/server";
import { getRevenueRiskBands, getRevenueSankey } from "@/lib/queries/revenue.sql";

export const revalidate = 60;

export async function GET() {
  const [bands, sankey] = await Promise.all([getRevenueRiskBands(), getRevenueSankey()]);
  return NextResponse.json({ bands, sankey });
}
