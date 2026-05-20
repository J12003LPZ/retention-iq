create or replace view v_customer_signup_month as
select id as customer_id,
       date_trunc('month', signup_date)::date as cohort_month
from customers;

create or replace view v_customer_active_months as
select c.id as customer_id,
       date_trunc('month', c.signup_date)::date as cohort_month,
       gs::date as active_month
from customers c
cross join lateral generate_series(
  date_trunc('month', c.signup_date),
  coalesce(date_trunc('month', c.churned_at), date_trunc('month', current_date)),
  interval '1 month'
) as gs
where c.signup_date <= gs;

create or replace view v_customer_ltv as
select c.id as customer_id,
       coalesce(sum(p.amount_cents) filter (where p.status='succeeded'), 0) as ltv_cents
from customers c
left join payments p on p.customer_id = c.id
group by c.id;

do $$ begin
  if not exists (select 1 from pg_roles where rolname='retentioniq_ro') then
    create role retentioniq_ro login password 'change-me-after-migrate';
  end if;
end $$;

do $grant$ begin
  execute format('grant connect on database %I to retentioniq_ro', current_database());
end $grant$;
grant usage on schema public to retentioniq_ro;
grant select on all tables in schema public to retentioniq_ro;
alter default privileges in schema public grant select on tables to retentioniq_ro;
