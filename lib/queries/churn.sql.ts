import { sql } from "@/lib/db";
import type { ChurnTrendPoint, ChurnDriver } from "@/lib/types";

export async function getChurnTrend(granularity: "daily" | "weekly" | "monthly") {
  const bucket = granularity === "daily" ? "day" : granularity === "weekly" ? "week" : "month";
  const rows = await sql`
    with buckets as (
      select generate_series(
        date_trunc(${bucket}::text, current_date - interval '180 days'),
        date_trunc(${bucket}::text, current_date),
        ('1 ' || ${bucket}::text)::interval
      )::date as bucket_start
    )
    select to_char(b.bucket_start, 'YYYY-MM-DD') as date,
           count(c.id) filter (
             where date_trunc(${bucket}::text, c.churned_at) = b.bucket_start
           )::int as churned_count,
           count(c.id) filter (
             where c.signup_date <= b.bucket_start
               and (c.churned_at is null or c.churned_at > b.bucket_start)
           )::int as active_count,
           coalesce(
             count(c.id) filter (where date_trunc(${bucket}::text, c.churned_at) = b.bucket_start)::float
               / nullif(count(c.id) filter (
                   where c.signup_date <= b.bucket_start
                     and (c.churned_at is null or c.churned_at > b.bucket_start)
                 ), 0),
             0
           ) * 100 as churn_pct
    from buckets b
    left join customers c on true
    group by b.bucket_start
    order by b.bucket_start;
  ` as unknown as { date: string; churned_count: number; active_count: number; churn_pct: number }[];

  return rows.map<ChurnTrendPoint>((r) => ({
    date: r.date,
    churnPct: Number(r.churn_pct),
    churnedCount: r.churned_count,
    activeCount: r.active_count,
  }));
}

export async function getChurnDrivers(): Promise<ChurnDriver[]> {
  const rows = await sql`
    with churned as (
      select churn_reason from customers where churned_at is not null
    ),
    total as (select count(*)::float as n from churned)
    select churn_reason as driver,
           round((count(*) * 100.0 / (select n from total))::numeric, 1) as share_pct
    from churned
    where churn_reason is not null
    group by churn_reason
    order by count(*) desc
  ` as unknown as { driver: string; share_pct: number }[];
  return rows.map((r) => ({ driver: r.driver, sharePct: Number(r.share_pct) }));
}
