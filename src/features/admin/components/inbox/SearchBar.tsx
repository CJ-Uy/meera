"use client";

import { Icon } from "@/components/demo/shared";

export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
	return (
		<label className="flex items-center gap-2 rounded-2xl border bg-[#FCFAF6] px-3 py-2 text-sm" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
			<Icon name="sparkle" size={14} className="text-[#2E9C8E]" />
			<span className="sr-only">Search tickets</span>
			<input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder="Search id, title, student, summary"
				className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none placeholder:font-medium"
				style={{ color: "var(--ink)" }}
			/>
		</label>
	);
}
