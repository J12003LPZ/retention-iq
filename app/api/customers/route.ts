import { NextResponse } from "next/server";
import { getCustomers, type ListOpts } from "@/lib/queries/customers.sql";

export const revalidate = 60;

const VALID_SORTS = ["health", "churnProb", "mrr", "lastLogin"] as const;
const VALID_DIRS = ["asc", "desc"] as const;

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const rawSort = u.searchParams.get("sort");
    const rawDir = u.searchParams.get("dir");
    const sort = (VALID_SORTS as readonly string[]).includes(rawSort ?? "")
      ? (rawSort as ListOpts["sort"])
      : undefined;
    const dir = (VALID_DIRS as readonly string[]).includes(rawDir ?? "")
      ? (rawDir as ListOpts["dir"])
      : undefined;
    const data = await getCustomers({
      search:   u.searchParams.get("q") ?? undefined,
      region:   u.searchParams.get("region") ?? undefined,
      plan:     u.searchParams.get("plan") ?? undefined,
      riskMin:  u.searchParams.has("riskMin") ? Number(u.searchParams.get("riskMin")) : undefined,
      sort,
      dir,
      page:     Number(u.searchParams.get("page") ?? "1"),
      pageSize: Number(u.searchParams.get("pageSize") ?? "25"),
    });
    return NextResponse.json({ rows: data });
  } catch {
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
