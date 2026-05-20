import { NextResponse } from "next/server";
import { getSupportAnalytics } from "@/lib/queries/support.sql";

export const revalidate = 60;

export async function GET() {
  return NextResponse.json({ rows: await getSupportAnalytics() });
}
