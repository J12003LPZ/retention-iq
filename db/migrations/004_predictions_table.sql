create table if not exists churn_predictions (
  customer_id  uuid primary key references customers(id) on delete cascade,
  churn_prob   real not null,
  top_factors  jsonb not null default '[]',
  scored_at    timestamptz not null default now()
);

create table if not exists model_feature_importance (
  id           serial primary key,
  feature      text not null,
  importance   real not null,
  trained_at   timestamptz not null default now()
);
