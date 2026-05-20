"""
train_model.py — fit a logistic-regression churn classifier, persist:
  - public/model/churn_model.joblib  (sklearn pipeline; first-party artifact only)
  - churn_predictions table          (per-customer score)
  - model_feature_importance         (coefficients for the UI bar chart)
"""
from __future__ import annotations
import os, json, joblib
from pathlib import Path
import numpy as np
import pandas as pd
import psycopg
from dotenv import load_dotenv
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

load_dotenv(".env.local")
DB = os.environ["DATABASE_URL"]
OUT = Path("public/model"); OUT.mkdir(parents=True, exist_ok=True)

FEATURES_SQL = """
with last_60 as (
  select customer_id, sum(count)::int as logins_60d
  from usage_events
  where event_at >= now() - interval '60 days' and event_type = 'login'
  group by customer_id
),
prev_60 as (
  select customer_id, sum(count)::int as logins_prev_60d
  from usage_events
  where event_at <  now() - interval '60 days'
    and event_at >= now() - interval '120 days'
    and event_type = 'login'
  group by customer_id
),
fails as (
  select customer_id, count(*)::int as failed_payments_180d
  from payments where status='failed' and paid_at >= now() - interval '180 days'
  group by customer_id
),
tix as (
  select customer_id,
         count(*) filter (where opened_at >= now() - interval '90 days')::int as tickets_90d,
         count(*) filter (where resolved_at is null)::int as open_tickets
  from support_tickets group by customer_id
),
mrr as (
  select distinct on (customer_id) customer_id, mrr_cents, plan_id
  from subscriptions where ended_at is null
  order by customer_id, started_at desc
)
select c.id as customer_id,
       (c.churned_at is not null)::int as churned,
       coalesce(last_60.logins_60d, 0)            as logins_60d,
       coalesce(prev_60.logins_prev_60d, 0)       as logins_prev_60d,
       coalesce(fails.failed_payments_180d, 0)    as failed_payments_180d,
       coalesce(tix.tickets_90d, 0)               as tickets_90d,
       coalesce(tix.open_tickets, 0)              as open_tickets,
       coalesce(mrr.mrr_cents, 0)                 as mrr_cents,
       coalesce(mrr.plan_id, 'starter')           as plan_id
from customers c
left join last_60 on last_60.customer_id = c.id
left join prev_60 on prev_60.customer_id = c.id
left join fails   on fails.customer_id   = c.id
left join tix     on tix.customer_id     = c.id
left join mrr     on mrr.customer_id     = c.id;
"""

PLAN_RANK = {"starter": 1, "growth": 2, "pro": 3, "enterprise": 4}

def main() -> None:
    with psycopg.connect(DB) as conn:
        df = pd.read_sql(FEATURES_SQL, conn)

    df["plan_rank"]    = df["plan_id"].map(PLAN_RANK).fillna(1)
    df["usage_delta"]  = df["logins_60d"] - df["logins_prev_60d"]
    df["mrr_dollars"]  = df["mrr_cents"] / 100.0

    feats = ["tickets_90d", "open_tickets", "failed_payments_180d",
             "usage_delta", "logins_60d", "plan_rank", "mrr_dollars"]
    X = df[feats].values
    y = df["churned"].values

    pipe = Pipeline([("scale", StandardScaler()), ("lr", LogisticRegression(max_iter=2000))])
    pipe.fit(X, y)
    df["churn_prob"] = pipe.predict_proba(X)[:, 1]

    joblib.dump({"pipeline": pipe, "features": feats}, OUT / "churn_model.joblib")
    print("saved model, mean prob positives vs negatives:",
          float(df.loc[df.churned==1, "churn_prob"].mean()),
          float(df.loc[df.churned==0, "churn_prob"].mean()))

    coefs = dict(zip(feats, pipe.named_steps["lr"].coef_.ravel().tolist()))
    rows = []
    for _, r in df.iterrows():
        contribs = sorted(
            [(f, float(coefs[f]) * float(r[f])) for f in feats],
            key=lambda t: abs(t[1]), reverse=True,
        )[:3]
        rows.append((
            r["customer_id"],
            float(r["churn_prob"]),
            json.dumps([{"feature": f, "weight": round(w, 4)} for f, w in contribs]),
        ))

    with psycopg.connect(DB, autocommit=False) as conn, conn.cursor() as cur:
        cur.execute("truncate churn_predictions;")
        cur.executemany(
            "insert into churn_predictions(customer_id, churn_prob, top_factors) values (%s, %s, %s::jsonb)",
            rows,
        )
        cur.execute("truncate model_feature_importance;")
        cur.executemany(
            "insert into model_feature_importance(feature, importance) values (%s, %s)",
            [(f, abs(coefs[f])) for f in feats],
        )
        conn.commit()
        print(f"wrote {len(rows)} predictions and {len(feats)} feature importances")

if __name__ == "__main__":
    main()
