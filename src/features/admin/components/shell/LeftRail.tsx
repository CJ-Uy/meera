"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountMenu } from "@/features/admin/components/shell/AccountMenu";
import { Icon, type IconName } from "@/components/demo/shared";

const navItems: { href: string; label: string; icon: IconName }[] = [
	{ href: "/demo/admin/inbox", label: "Inbox", icon: "inbox" },
	{ href: "/demo/admin/insights", label: "Insights", icon: "trend" },
	{ href: "/demo/admin/knowledge", label: "Knowledge", icon: "book" },
	{ href: "/demo/admin/team", label: "Team", icon: "users" },
];

export function LeftRail() {
	const pathname = usePathname();

	return (
		<aside className="hidden w-[236px] shrink-0 border-r bg-white p-3 md:flex md:flex-col" style={{ borderColor: "var(--line)" }}>
			<nav className="grid gap-1" aria-label="Admin navigation">
				{navItems.map((item) => {
					const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
					return (
						<Link
							key={item.href}
							href={item.href}
							aria-current={active ? "page" : undefined}
							className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-bold transition hover:bg-[#F8F5F0]"
							style={{ background: active ? "var(--teal-050)" : "transparent", borderColor: active ? "var(--teal-100)" : "transparent", color: active ? "var(--teal-700)" : "var(--ink-2)" }}
						>
							<Icon name={item.icon} size={16} stroke={active ? 2.2 : 1.8} />
							{item.label}
						</Link>
					);
				})}
			</nav>
			<div className="mt-auto">
				<AccountMenu />
			</div>
		</aside>
	);
}
