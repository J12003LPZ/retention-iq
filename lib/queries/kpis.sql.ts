import { sql } from "@/lib/db";
import type { KpiSummary } from "@/lib/types";

export async function getKpiSummary(rangeDays = 30): Promise<KpiSummary> {
  const rows = await sql`
    with bounds as (
      select current_date as today,
             current_date - (${rangeDays}::int) as period_start,
             current_date - (2 * ${rangeDays}::int) as prev_start
    ),
    cur as (
      select count(*) filter (where churned_at >= (select period_start from bounds)) as churned,
             count(*) filter (where churned_at is null or churned_at >= (select period_start from bounds)) as active_or_churned
      from customers
    ),
    prev as (
      select count(*) filter (
        where churned_at >= (select prev_start from bounds)
          and churned_at <  (select period_start from bounds)
      ) as churned,
      count(*) filter (
        where churned_at is null
           or (churned_at >= (select prev_start from bounds)
               and churned_at < (select period_start from bounds))
      ) as active_or_churned
      from customers
    ),
    risk as (
      select coalesce(sum(s.mrr_cents), 0)::bigint as cents,
             count(*) as users
      from customers c
      join subscriptions s on s.customer_id = c.id and s.ended_at is null
      where c.churned_at is null
        and exists (
          select 1 from churn_predictions p
          where p.customer_id = c.id and p.churn_prob >= 0.6
        )
    ),
    sparkline as (
      select to_char(d, 'YYYY-MM-DD') as date,
             coalesce(
               count(c.id) filter (where c.churned_at = d)::float
                 / nullif(count(c.id) filter (where c.signup_date <= d and (c.churned_at is null or c.churned_at > d)), 0),
               0
             ) * 100 as churn_pct
      from generate_series(current_date - interval '29 days', current_date, interval '1 day') d
      left join customers c on true
      group by d
      order by d
    ),
    health as (
      select coalesce(round(avg(100 - p.churn_prob * 100))::int, 75) as score
      from customers c
      left join churn_predictions p on p.customer_id = c.id
      where c.churned_at is null
    )
    select
      (select case when active_or_churned = 0 then 0 else churned * 100.0 / active_or_churned end from cur)            as churn_rate_pct,
      (select case when active_or_churned = 0 then 0 else churned * 100.0 / active_or_churned end from cur)
       -
      (select case when active_or_churned = 0 then 0 else churned * 100.0 / active_or_churned end from prev)           as churn_rate_delta_pct,
      (select cents from risk)                                                                                         as revenue_at_risk_cents,
      (select users from risk)                                                                                         as predicted_churn_users,
      (select score from health)                                                                                       as health_score,
      coalesce((select json_agg(json_build_object('date', date, 'churnPct', round(churn_pct::numeric, 2))) from sparkline), '[]') as trend
  `;
  const r = rows[0];
  return {
    churnRatePct: Number(r.churn_rate_pct),
    churnRateDeltaPct: Number(r.churn_rate_delta_pct),
    revenueAtRiskCents: Number(r.revenue_at_risk_cents),
    predictedChurnUsers: Number(r.predicted_churn_users),
    healthScore: Number(r.health_score),
    trend: r.trend as KpiSummary["trend"] ?? [],
  };
}
