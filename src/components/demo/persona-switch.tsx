"use client";

import Link from "next/link";
import { Icon } from "@/components/demo/shared";

type Persona = "student" | "admin";

const targets: Record<Persona, string> = {
	student: "/demo/student",
	admin: "/demo/admin/inbox",
};

/**
 * Consistent top-right control for swapping between the student and admin demo views. Rendered in both
 * the student chat header and the admin top bar so the switch lives in the same place everywhere.
 */
export function PersonaSwitch({ active }: { active: Persona }) {
	const options: { id: Persona; label: string; icon: "chat" | "eye" }[] = [
		{ id: "student", label: "Student", icon: "chat" },
		{ id: "admin", label: "Admin", icon: "eye" },
	];

	return (
		<div className="flex shrink-0 items-center gap-0.5 rounded-full border p-0.75" style={{ background: "var(--cream-2)", borderColor: "var(--line)" }} aria-label="Switch demo view">
			{options.map((option) => {
				const isActive = option.id === active;
				const className = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.25 text-[12.5px] font-bold transition";
				const style = isActive
					? { background: "#fff", color: "var(--teal-700)", boxShadow: "var(--sh-sm)" }
					: { background: "transparent", color: "var(--muted)" };
				if (isActive) {
					return (
						<span key={option.id} aria-current="page" className={className} style={style}>
							<Icon name={option.icon} size={13} />
							<span>{option.label}</span>
						</span>
					);
				}
				return (
					<Link key={option.id} href={targets[option.id]} className={`${className} hover:-translate-y-0.5`} style={style}>
						<Icon name={option.icon} size={13} />
						<span>{option.label}</span>
					</Link>
				);
			})}
		</div>
	);
}
