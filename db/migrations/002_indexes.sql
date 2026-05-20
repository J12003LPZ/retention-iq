create index if not exists ix_subs_customer    on subscriptions(customer_id);
create index if not exists ix_payments_cust_dt on payments(customer_id, paid_at desc);
create index if not exists ix_usage_cust_dt    on usage_events(customer_id, event_at desc);
create index if not exists ix_tickets_cust     on support_tickets(customer_id);
create index if not exists ix_customers_signup on customers(signup_date);
create index if not exists ix_customers_churn  on customers(churned_at);
create index if not exists ix_subs_plan        on subscriptions(plan_id);
