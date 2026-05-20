import { NextResponse } from "next/server";
import { getCohortRetention } from "@/lib/queries/cohorts.sql";

export const revalidate = 300;

export async function GET() {
  try {
    return NextResponse.json({ cells: await getCohortRetention(12) });
  } catch {
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
