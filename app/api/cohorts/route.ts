import { NextResponse } from "next/server";
import { getCohortRetention } from "@/lib/queries/cohorts.sql";

export const revalidate = 300;

export async function GET() {
  return NextResponse.json({ cells: await getCohortRetention(12) });
}
