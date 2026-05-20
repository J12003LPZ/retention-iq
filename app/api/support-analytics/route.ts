import { NextResponse } from "next/server";
import { getSupportAnalytics } from "@/lib/queries/support.sql";

export const revalidate = 60;

export async function GET() {
  try {
    return NextResponse.json({ rows: await getSupportAnalytics() });
  } catch {
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
