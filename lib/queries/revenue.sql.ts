import { sql } from "@/lib/db";
import type { RevenueRiskBand } from "@/lib/types";

export async function getRevenueRiskBands(): Promise<RevenueRiskBand[]> {
  const rows = await sql`
    with banded as (
      select c.id,
             case
               when coalesce(p.churn_prob,0) >= 0.85 then 'critical'
               when coalesce(p.churn_prob,0) >= 0.6  then 'high'
               when coalesce(p.churn_prob,0) >= 0.35 then 'moderate'
               else 'safe'
             end as band,
             coalesce(s.mrr_cents, 0) as mrr_cents
      from customers c
      left join churn_predictions p on p.customer_id = c.id
      left join lateral (
        select mrr_cents from subscriptions
        where customer_id = c.id and ended_at is null
        order by started_at desc limit 1
      ) s on true
      where c.churned_at is null
    )
    select band, count(*)::int as customers, sum(mrr_cents)::bigint as mrr_cents
    from banded group by band
  ` as unknown as Array<{ band: string; customers: number; mrr_cents: number }>;
  return rows.map((r) => ({ band: r.band as RevenueRiskBand["band"], customers: r.customers, mrrCents: Number(r.mrr_cents) }));
}

export async function getRevenueSankey() {
  return sql`
    with snap as (
      select c.id,
             case
               when c.churned_at is null and coalesce(p.churn_prob,0) >= 0.6 then 'at_risk'
               when c.churned_at is null then 'healthy'
               else 'churned'
             end as bucket,
             coalesce(s.mrr_cents, 0) as mrr_cents
      from customers c
      left join churn_predictions p on p.customer_id = c.id
      left join lateral (
        select mrr_cents from subscriptions
        where customer_id=c.id and ended_at is null order by started_at desc limit 1
      ) s on true
    )
    select bucket, count(*)::int as users, sum(mrr_cents)::bigint as mrr_cents
    from snap group by bucket;
  `;
}
