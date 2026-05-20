import { sql } from "@/lib/db";

export interface SupportAnalyticsRow {
  category: string;
  tickets: number;
  avgHoursToResolve: number;
  avgCsat: number | null;
}

export async function getSupportAnalytics(): Promise<SupportAnalyticsRow[]> {
  const rows = await sql`
    select category,
           count(*)::int                                                              as tickets,
           round(avg(extract(epoch from (coalesce(resolved_at, now()) - opened_at)) / 3600)::numeric, 1) as avg_hours_to_resolve,
           round(avg(satisfaction)::numeric, 2)                                       as avg_csat
    from support_tickets
    group by category order by tickets desc;
  ` as unknown as { category: string; tickets: number; avg_hours_to_resolve: number; avg_csat: number | null }[];
  return rows.map((r) => ({
    category: r.category,
    tickets: r.tickets,
    avgHoursToResolve: Number(r.avg_hours_to_resolve),
    avgCsat: r.avg_csat !== null ? Number(r.avg_csat) : null,
  }));
}
