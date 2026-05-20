import { NextResponse } from "next/server";
import { getCustomers } from "@/lib/queries/customers.sql";

export const revalidate = 60;

export async function GET(req: Request) {
  const u = new URL(req.url);
  const data = await getCustomers({
    search:   u.searchParams.get("q") ?? undefined,
    region:   u.searchParams.get("region") ?? undefined,
    plan:     u.searchParams.get("plan") ?? undefined,
    riskMin:  u.searchParams.has("riskMin") ? Number(u.searchParams.get("riskMin")) : undefined,
    sort:     (u.searchParams.get("sort") as never) ?? undefined,
    dir:      (u.searchParams.get("dir") as never) ?? undefined,
    page:     Number(u.searchParams.get("page") ?? "1"),
    pageSize: Number(u.searchParams.get("pageSize") ?? "25"),
  });
  return NextResponse.json({ rows: data });
}
