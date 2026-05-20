import { sql } from "@/lib/db";

export async function getSupportAnalytics() {
  return sql`
    select category,
           count(*)::int                                                              as tickets,
           round(avg(extract(epoch from (coalesce(resolved_at, now()) - opened_at)) / 3600)::numeric, 1) as avg_hours_to_resolve,
           round(avg(satisfaction)::numeric, 2)                                       as avg_csat
    from support_tickets
    group by category order by tickets desc;
  `;
}
