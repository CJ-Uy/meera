"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { MeerkatMark } from "@/components/demo/shared";
import { PersonaSwitch } from "@/components/demo/persona-switch";

/**
 * Shared demo top bar shell. Keeps the Meera wordmark, header height, and the Student/Admin persona
 * switch identical across the student chat and the admin dashboard; the middle `children` differ per
 * view (status + view toggle on student; department + acting-admin controls on admin).
 */
export function DemoHeader({ persona, children }: { persona: "student" | "admin"; children?: ReactNode }) {
	return (
		<header className="flex min-h-[58px] shrink-0 items-center gap-2 border-b bg-white px-3 py-2 sm:gap-3 sm:px-4" style={{ borderColor: "var(--line)" }}>
			<Link href="/" className="inline-flex shrink-0 items-center gap-[7px]" aria-label="Meera home">
				<MeerkatMark size={30} />
				<span className="text-[15px] font-[800] tracking-[-0.03em]">Meera</span>
			</Link>
			<span className="h-[18px] w-px shrink-0" style={{ background: "var(--line-2)" }} />
			<div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto sm:gap-3">{children}</div>
			<PersonaSwitch active={persona} />
		</header>
	);
}
