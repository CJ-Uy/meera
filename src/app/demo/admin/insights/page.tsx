"use client";

import dynamic from "next/dynamic";

// Recharts is client-only; load the dashboard without SSR to avoid hydration mismatches.
const InsightsDashboard = dynamic(
	() => import("@/features/admin/components/insights").then((mod) => mod.InsightsDashboard),
	{ ssr: false },
);

export default function AdminInsightsPage() {
	return <InsightsDashboard />;
}
