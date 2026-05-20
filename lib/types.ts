export type Region    = "NA" | "EMEA" | "APAC" | "LATAM";
export type PlanId    = "starter" | "growth" | "pro" | "enterprise";
export type RiskBand  = "safe" | "moderate" | "high" | "critical";

export interface KpiSummary {
  churnRatePct: number;
  churnRateDeltaPct: number;
  revenueAtRiskCents: number;
  predictedChurnUsers: number;
  healthScore: number;
  trend: { date: string; churnPct: number }[];
}

export interface ChurnTrendPoint { date: string; churnPct: number; churnedCount: number; activeCount: number; }
export interface ChurnDriver     { driver: string; sharePct: number; }
export interface CustomerRow {
  id: string; companyName: string; healthScore: number; churnProb: number;
  mrrCents: number; lastLogin: string | null; openTickets: number;
  recommendedAction: string; region: Region; plan: PlanId;
}
export interface CohortCell { cohortMonth: string; monthIndex: number; retentionPct: number; cohortSize: number; }
export interface RevenueRiskBand { band: RiskBand; customers: number; mrrCents: number; }
export interface FeatureImportance { feature: string; importance: number; }
