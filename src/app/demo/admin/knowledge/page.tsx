"use client";

import dynamic from "next/dynamic";

// React Flow is client-only; load the dashboard without SSR to avoid hydration mismatches.
const KnowledgeDashboard = dynamic(
	() => import("@/features/admin/components/kb").then((mod) => mod.KnowledgeDashboard),
	{ ssr: false },
);

export default function AdminKnowledgePage() {
	return <KnowledgeDashboard />;
}
