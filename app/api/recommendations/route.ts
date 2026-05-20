import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { RECOMMENDATION_RULES } from "@/lib/recommendations";

export async function GET() {
  try {
    const out = [];
    for (const r of RECOMMENDATION_RULES) {
      const rows = await sql`
        select count(*)::int as customers,
               coalesce(sum(s.mrr_cents), 0)::bigint as mrr_cents
        from customers c
        left join churn_predictions p on p.customer_id = c.id
        left join lateral (
          select event_at as last_login from usage_events
          where customer_id=c.id and event_type='login'
          order by event_at desc limit 1
        ) ll on true
        left join lateral (
          select mrr_cents from subscriptions
          where customer_id=c.id and ended_at is null
          order by started_at desc limit 1
        ) s on true
        where c.churned_at is null and ${sql.unsafe(r.where)}
      `;
      out.push({ ...r, ...rows[0] });
    }
    return NextResponse.json({ recommendations: out });
  } catch {
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
