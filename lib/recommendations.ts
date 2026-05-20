export interface RecommendationRule {
  id: string
  title: string
  where: string
  action: string
  confidence: number
  expectedReductionPct: number
}

export const RECOMMENDATION_RULES: RecommendationRule[] = [
  {
    id: "declining-usage",
    title: "Customers with declining usage",
    where: "p.churn_prob between 0.4 and 0.7 and coalesce(ll.last_login, '1900-01-01') < now() - interval '21 days'",
    action: "Send onboarding/tutorial emails + product walkthrough",
    confidence: 0.78,
    expectedReductionPct: 8,
  },
  {
    id: "ticket-storm",
    title: "Customers with 3+ unresolved tickets",
    where: "(select count(*) from support_tickets t where t.customer_id = c.id and t.resolved_at is null) >= 3",
    action: "Assign dedicated CSM + priority response SLA",
    confidence: 0.84,
    expectedReductionPct: 12,
  },
  {
    id: "payment-fails",
    title: "Customers with repeat payment failures",
    where: "(select count(*) from payments p2 where p2.customer_id=c.id and p2.status='failed' and p2.paid_at > now()-interval '180 days') >= 2",
    action: "Trigger Smart Retries + offer ACH/invoice billing",
    confidence: 0.71,
    expectedReductionPct: 6,
  },
]
