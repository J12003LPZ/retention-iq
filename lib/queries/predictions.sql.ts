import { sql } from "@/lib/db";
import type { FeatureImportance, RiskBand } from "@/lib/types";

export async function getFeatureImportance(): Promise<FeatureImportance[]> {
  const rows = await sql`
    select feature, importance from model_feature_importance order by importance desc;
  ` as unknown as Array<{ feature: string; importance: number }>;
  return rows.map((r) => ({ feature: r.feature, importance: Number(r.importance) }));
}

export async function getRiskSegments(): Promise<{ band: RiskBand; customers: number; mrrCents: number }[]> {
  const rows = await sql`
    with banded as (
      select c.id,
             case
               when p.churn_prob >= 0.85 then 'critical'
               when p.churn_prob >= 0.6  then 'high'
               when p.churn_prob >= 0.35 then 'moderate'
               else 'safe'
             end as band,
             coalesce(s.mrr_cents, 0) as mrr_cents
      from customers c
      join churn_predictions p on p.customer_id = c.id
      left join lateral (
        select mrr_cents from subscriptions
        where customer_id = c.id and ended_at is null
        order by started_at desc limit 1
      ) s on true
      where c.churned_at is null
    )
    select band, count(*)::int as customers, sum(mrr_cents)::bigint as mrr_cents
    from banded group by band
  ` as unknown as Array<{ band: RiskBand; customers: number; mrr_cents: number }>;
  return rows.map((r) => ({ band: r.band, customers: r.customers, mrrCents: Number(r.mrr_cents) }));
}

export interface TopSaveRow {
  id: string;
  companyName: string;
  region: string;
  churnProb: number;
  mrrCents: number;
  planId: string;
}

export async function getTopToSave(limit = 100): Promise<TopSaveRow[]> {
  const rows = await sql`
    select c.id, c.company_name, c.region, p.churn_prob, s.mrr_cents, s.plan_id
    from customers c
    join churn_predictions p on p.customer_id = c.id
    left join lateral (
      select mrr_cents, plan_id from subscriptions
      where customer_id = c.id and ended_at is null
      order by started_at desc limit 1
    ) s on true
    where c.churned_at is null and p.churn_prob >= 0.5
    order by (p.churn_prob * coalesce(s.mrr_cents, 0)) desc
    limit ${limit};
  ` as unknown as Array<{ id: string; company_name: string; region: string; churn_prob: number; mrr_cents: number; plan_id: string }>;
  return rows.map((r) => ({
    id: r.id,
    companyName: r.company_name,
    region: r.region,
    churnProb: Number(r.churn_prob),
    mrrCents: Number(r.mrr_cents),
    planId: r.plan_id,
  }));
}
