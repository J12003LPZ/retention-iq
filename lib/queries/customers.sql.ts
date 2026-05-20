import { sql } from "@/lib/db";
import type { CustomerRow } from "@/lib/types";

export interface ListOpts {
  search?: string;
  region?: string;
  plan?: string;
  riskMin?: number;
  sort?: "health" | "churnProb" | "mrr" | "lastLogin";
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function getCustomers(opts: ListOpts = {}) {
  const page    = Math.max(1, opts.page ?? 1);
  const size    = Math.min(100, Math.max(10, opts.pageSize ?? 25));
  const sortMap = {
    health: "health_score",
    churnProb: "churn_prob",
    mrr: "mrr_cents",
    lastLogin: "last_login",
  } as const;
  const sortCol = sortMap[opts.sort ?? "churnProb"];
  const dir     = opts.dir === "asc" ? "asc" : "desc";

  const rows = await sql`
    with last_login as (
      select customer_id, max(event_at) as last_login
      from usage_events where event_type = 'login' group by customer_id
    ),
    open_tickets as (
      select customer_id, count(*) as open_count
      from support_tickets where resolved_at is null group by customer_id
    ),
    sub as (
      select distinct on (customer_id) customer_id, mrr_cents, plan_id
      from subscriptions where ended_at is null
      order by customer_id, started_at desc
    )
    select c.id,
           c.company_name,
           c.region,
           s.plan_id,
           coalesce(s.mrr_cents, 0)               as mrr_cents,
           coalesce(p.churn_prob, 0.5)            as churn_prob,
           round((100 - coalesce(p.churn_prob,0.5) * 100))::int as health_score,
           ll.last_login                          as last_login,
           coalesce(ot.open_count, 0)::int        as open_tickets,
           case
             when coalesce(p.churn_prob,0) >= 0.8 then 'Schedule executive review'
             when coalesce(p.churn_prob,0) >= 0.6 then 'Offer priority support'
             when coalesce(ot.open_count,0) >= 3  then 'Escalate open tickets'
             when ll.last_login < (now() - interval '21 days') then 'Re-engagement email'
             else 'Monitor'
           end as recommended_action
    from customers c
    left join sub s on s.customer_id = c.id
    left join churn_predictions p on p.customer_id = c.id
    left join last_login ll on ll.customer_id = c.id
    left join open_tickets ot on ot.customer_id = c.id
    where c.churned_at is null
      and (${opts.search ?? null}::text is null
           or c.company_name ilike '%' || ${opts.search ?? null} || '%'
           or c.email        ilike '%' || ${opts.search ?? null} || '%')
      and (${opts.region ?? null}::text is null or c.region = ${opts.region ?? null})
      and (${opts.plan   ?? null}::text is null or s.plan_id = ${opts.plan ?? null})
      and (${opts.riskMin ?? null}::float is null or coalesce(p.churn_prob, 0) >= ${opts.riskMin ?? null})
    order by ${sql.unsafe(sortCol)} ${sql.unsafe(dir)} nulls last
    limit ${size} offset ${(page - 1) * size}
  ` as unknown as Array<{
    id: string; company_name: string; region: string; plan_id: string;
    mrr_cents: number; churn_prob: number; health_score: number;
    last_login: string | null; open_tickets: number; recommended_action: string;
  }>;

  return rows.map<CustomerRow>((r) => ({
    id: r.id, companyName: r.company_name, healthScore: r.health_score,
    churnProb: Number(r.churn_prob), mrrCents: r.mrr_cents,
    lastLogin: r.last_login, openTickets: r.open_tickets,
    recommendedAction: r.recommended_action,
    region: r.region as CustomerRow["region"],
    plan: r.plan_id as CustomerRow["plan"],
  }));
}

export async function getCustomerById(id: string) {
  const [base] = await sql`
    select c.*, s.plan_id, s.mrr_cents, p.churn_prob, p.top_factors
    from customers c
    left join lateral (
      select plan_id, mrr_cents from subscriptions
      where customer_id = c.id and ended_at is null
      order by started_at desc limit 1
    ) s on true
    left join churn_predictions p on p.customer_id = c.id
    where c.id = ${id}
  ` as unknown as Array<Record<string, unknown>>;
  if (!base) return null;

  const usage = await sql`
    select date_trunc('week', event_at)::date as week, sum(count)::int as total
    from usage_events where customer_id = ${id} and event_type='login'
    group by 1 order by 1
  `;
  const tickets = await sql`
    select id, opened_at, resolved_at, severity, category, satisfaction
    from support_tickets where customer_id = ${id} order by opened_at desc
  `;
  const payments = await sql`
    select id, amount_cents, status, paid_at
    from payments where customer_id = ${id} order by paid_at desc limit 24
  `;
  return { ...base, usage, tickets, payments };
}
