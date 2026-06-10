export default function AdminInsightsPage() {
	return <Placeholder title="Insights" />;
}

function Placeholder({ title }: { title: string }) {
	return <div className="mx-auto w-[min(900px,calc(100%_-_2rem))] py-8"><p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>Coming soon</p><h1 className="mt-2 text-3xl font-[800]">{title}</h1><p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-2)" }}>This Phase 0 route is ready for the next admin dashboard phase.</p></div>;
}
