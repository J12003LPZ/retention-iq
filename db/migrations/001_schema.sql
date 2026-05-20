create table if not exists plans (
  id            text primary key,
  name          text not null,
  monthly_cents int  not null,
  tier_rank     int  not null
);

create table if not exists customers (
  id            uuid primary key default gen_random_uuid(),
  company_name  text not null,
  contact_name  text not null,
  email         text not null unique,
  region        text not null,
  industry      text not null,
  signup_date   date not null,
  churned_at    date,
  churn_reason  text
);

create table if not exists subscriptions (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references customers(id) on delete cascade,
  plan_id       text not null references plans(id),
  started_at    date not null,
  ended_at      date,
  mrr_cents     int  not null
);

create table if not exists payments (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references customers(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  amount_cents    int  not null,
  status          text not null,
  paid_at         timestamptz not null
);

create table if not exists usage_events (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references customers(id) on delete cascade,
  event_type   text not null,
  event_at     timestamptz not null,
  count        int  not null default 1
);

create table if not exists support_tickets (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references customers(id) on delete cascade,
  opened_at    timestamptz not null,
  resolved_at  timestamptz,
  severity     text not null,
  category     text not null,
  satisfaction int
);
