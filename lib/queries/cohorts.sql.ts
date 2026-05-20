import { sql } from "@/lib/db";
import type { CohortCell } from "@/lib/types";

export async function getCohortRetention(maxMonths = 12): Promise<CohortCell[]> {
  const rows = await sql`
    with cohorts as (
      select date_trunc('month', signup_date)::date as cohort_month, id
      from customers where signup_date >= current_date - interval '18 months'
    ),
    sizes as (
      select cohort_month, count(*)::int as cohort_size from cohorts group by cohort_month
    ),
    active as (
      select v.cohort_month,
             ((extract(year from v.active_month) - extract(year from v.cohort_month)) * 12
              + (extract(month from v.active_month) - extract(month from v.cohort_month)))::int as month_index,
             count(distinct v.customer_id)::int as retained
      from v_customer_active_months v
      join cohorts c on c.id = v.customer_id
      group by 1, 2
    )
    select to_char(a.cohort_month, 'YYYY-MM') as cohort_month,
           a.month_index,
           round((a.retained * 100.0 / s.cohort_size)::numeric, 1) as retention_pct,
           s.cohort_size
    from active a
    join sizes s on s.cohort_month = a.cohort_month
    where a.month_index <= ${maxMonths}
    order by a.cohort_month, a.month_index;
  ` as unknown as Array<{ cohort_month: string; month_index: number; retention_pct: number; cohort_size: number }>;

  return rows.map<CohortCell>((r) => ({
    cohortMonth: r.cohort_month, monthIndex: r.month_index,
    retentionPct: Number(r.retention_pct), cohortSize: r.cohort_size,
  }));
}
