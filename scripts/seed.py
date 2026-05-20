"""seed.py — populate Neon with a synthetic SaaS dataset with a baked-in churn signal."""
from __future__ import annotations
import os, random, math
from datetime import datetime, timedelta, date
from faker import Faker
import numpy as np
import psycopg
from dotenv import load_dotenv

load_dotenv(".env.local")
DB = os.environ["DATABASE_URL"]

N_CUSTOMERS = 5000
START = date(2023, 1, 1)
END   = date(2026, 5, 1)
PLANS = [
    ("starter",    "Starter",     2900,  1),
    ("growth",     "Growth",      9900,  2),
    ("pro",        "Pro",        24900,  3),
    ("enterprise", "Enterprise", 79900,  4),
]
REGIONS    = ["NA", "EMEA", "APAC", "LATAM"]
INDUSTRIES = ["SaaS", "Fintech", "Retail", "Healthcare", "Media", "Logistics"]
TICKET_CATS = ["billing", "outage", "feature_request", "onboarding", "integration"]
CHURN_REASONS = [
    "Poor support experience", "Declining usage", "Missing features",
    "Pricing / budget", "Payment failures", "Contract not renewed",
]

fake = Faker(); Faker.seed(42); random.seed(42); np.random.seed(42)

def rand_date(a: date, b: date) -> date:
    return a + timedelta(days=random.randint(0, (b - a).days))

def main() -> None:
    with psycopg.connect(DB, autocommit=False) as conn, conn.cursor() as cur:
        cur.execute("truncate support_tickets, usage_events, payments, subscriptions, customers, plans cascade;")
        cur.executemany(
            "insert into plans(id,name,monthly_cents,tier_rank) values(%s,%s,%s,%s)",
            PLANS,
        )

        customers, subs, payments, usage, tickets = [], [], [], [], []
        for _ in range(N_CUSTOMERS):
            signup = rand_date(START, END - timedelta(days=30))
            plan = random.choices(PLANS, weights=[0.45, 0.30, 0.18, 0.07])[0]
            tier_rank = plan[3]
            n_tickets = np.random.poisson(1.2 + (4 - tier_rank) * 0.4)
            usage_decline = np.clip(np.random.normal(0.0, 0.3), -1.0, 1.0)
            n_payment_fails = np.random.binomial(8, 0.04 + (4 - tier_rank) * 0.01)

            z = (
                -2.2
                + 0.45 * max(0, n_tickets - 2)
                + 1.6  * max(0.0, -usage_decline)
                + 0.55 * n_payment_fails
                + 0.15 * (4 - tier_rank)
            )
            p_churn = 1 / (1 + math.exp(-z))
            churned = np.random.rand() < p_churn
            tenure_days = (END - signup).days
            churn_day = random.randint(45, max(46, tenure_days)) if churned else None
            churned_at = signup + timedelta(days=churn_day) if churn_day else None
            churn_reason = random.choice(CHURN_REASONS) if churned else None

            cust = (
                fake.uuid4(), fake.company(), fake.name(), fake.unique.email(),
                random.choice(REGIONS), random.choice(INDUSTRIES),
                signup, churned_at, churn_reason,
            )
            customers.append(cust)

            sub_id = fake.uuid4()
            subs.append((sub_id, cust[0], plan[0], signup, churned_at, plan[2]))

            cursor_date = signup
            stop = churned_at or END
            while cursor_date < stop:
                fail = (n_payment_fails > 0 and random.random() < 0.15)
                if fail:
                    n_payment_fails -= 1
                    status = "failed"
                else:
                    status = "succeeded"
                payments.append((
                    fake.uuid4(), cust[0], sub_id, plan[2], status,
                    datetime.combine(cursor_date, datetime.min.time()),
                ))
                cursor_date = cursor_date + timedelta(days=30)

            months_active = max(1, (stop - signup).days // 30)
            for m in range(months_active):
                base = 30 * (1.0 + usage_decline * (m / max(1, months_active)))
                n = max(0, int(np.random.normal(base, 6)))
                if n:
                    day = signup + timedelta(days=30 * m + random.randint(0, 27))
                    usage.append((fake.uuid4(), cust[0], "login",
                                   datetime.combine(day, datetime.min.time()), n))

            for _ in range(n_tickets):
                opened = rand_date(signup, stop)
                resolved = opened + timedelta(hours=random.randint(2, 240)) if random.random() > 0.15 else None
                tickets.append((
                    fake.uuid4(), cust[0],
                    datetime.combine(opened, datetime.min.time()),
                    datetime.combine(resolved, datetime.min.time()) if resolved else None,
                    random.choice(["low", "medium", "high", "critical"]),
                    random.choice(TICKET_CATS),
                    random.choice([None, 1, 2, 3, 4, 5]),
                ))

        cur.executemany(
            "insert into customers(id,company_name,contact_name,email,region,industry,signup_date,churned_at,churn_reason) values(%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            customers,
        )
        cur.executemany(
            "insert into subscriptions(id,customer_id,plan_id,started_at,ended_at,mrr_cents) values(%s,%s,%s,%s,%s,%s)",
            subs,
        )
        cur.executemany(
            "insert into payments(id,customer_id,subscription_id,amount_cents,status,paid_at) values(%s,%s,%s,%s,%s,%s)",
            payments,
        )
        cur.executemany(
            "insert into usage_events(id,customer_id,event_type,event_at,count) values(%s,%s,%s,%s,%s)",
            usage,
        )
        cur.executemany(
            "insert into support_tickets(id,customer_id,opened_at,resolved_at,severity,category,satisfaction) values(%s,%s,%s,%s,%s,%s,%s)",
            tickets,
        )
        conn.commit()
        print(f"seeded {len(customers)} customers, {len(payments)} payments, {len(usage)} usage rows, {len(tickets)} tickets")

if __name__ == "__main__":
    main()
