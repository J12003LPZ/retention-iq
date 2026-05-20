import { NextResponse } from "next/server";
import { getFeatureImportance, getRiskSegments, getTopToSave } from "@/lib/queries/predictions.sql";

export const revalidate = 300;

export async function GET() {
  const [importance, segments, topToSave] = await Promise.all([
    getFeatureImportance(), getRiskSegments(), getTopToSave(100),
  ]);
  return NextResponse.json({ importance, segments, topToSave });
}
