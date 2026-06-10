import type { DepartmentCode } from "@/features/admin/types";

export type DepartmentAccent = {
	/** Saturated fill used for dots, avatars, and graph hubs. */
	solid: string;
	/** Tinted wash used for soft backgrounds. */
	soft: string;
	/** Readable foreground on the soft wash. */
	text: string;
};

export const DEPARTMENT_ACCENT: Record<DepartmentCode | "shared", DepartmentAccent> = {
	IT: { solid: "var(--teal)", soft: "var(--teal-050)", text: "var(--teal-700)" },
	REG: { solid: "var(--sand)", soft: "var(--sand-050)", text: "var(--sand-600)" },
	MED: { solid: "var(--green)", soft: "var(--green-050)", text: "#4f7e32" },
	SS: { solid: "var(--rose)", soft: "#FCE9E1", text: "#a95338" },
	FIN: { solid: "var(--gold)", soft: "var(--gold-050)", text: "#8b6428" },
	shared: { solid: "var(--ink)", soft: "#EEF2F5", text: "var(--ink)" },
};

export function departmentAccent(code: DepartmentCode | "shared"): DepartmentAccent {
	return DEPARTMENT_ACCENT[code] ?? DEPARTMENT_ACCENT.shared;
}

/** Two-letter initials from an admin name, e.g. "Priya Nair" -> "PN". */
export function initialsOf(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
