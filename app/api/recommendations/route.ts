import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const revalidate = 300;

const RULES = [
  {
    id: "declining-usage",
    title: "Customers with declining usage",
    where: "p.churn_prob between 0.4 and 0.7 and coalesce(ll.last_login, '1900-01-01') < now() - interval '21 days'",
    action: "Send onboarding/tutorial emails + product walkthrough",
    confidence: 0.78,
    expectedReductionPct: 8,
  },
  {
    id: "ticket-storm",
    title: "Customers with 3+ unresolved tickets",
    where: "(select count(*) from support_tickets t where t.customer_id = c.id and t.resolved_at is null) >= 3",
    action: "Assign dedicated CSM + priority response SLA",
    confidence: 0.84,
    expectedReductionPct: 12,
  },
  {
    id: "payment-fails",
    title: "Customers with repeat payment failures",
    where: "(select count(*) from payments p2 where p2.customer_id=c.id and p2.status='failed' and p2.paid_at > now()-interval '180 days') >= 2",
    action: "Trigger Smart Retries + offer ACH/invoice billing",
    confidence: 0.71,
    expectedReductionPct: 6,
  },
];

export async function GET() {
  const out = [];
  for (const r of RULES) {
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
}
