"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type DropdownProps = {
	/** Renders the trigger button contents; receives the current open state. */
	trigger: (state: { open: boolean }) => ReactNode;
	/** Renders the panel contents; receives a `close` callback. */
	children: (close: () => void) => ReactNode;
	align?: "start" | "end";
	width?: number;
	label?: string;
};

/**
 * Small accessible popover used by the top-bar selectors. Handles outside-click,
 * Escape, and a subtle enter animation while staying inside the Meera token system.
 */
export function Dropdown({ trigger, children, align = "start", width = 268, label }: DropdownProps) {
	const [open, setOpen] = useState(false);
	const [entered, setEntered] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) {
			setEntered(false);
			return;
		}
		const frame = requestAnimationFrame(() => setEntered(true));
		const onPointer = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};
		document.addEventListener("mousedown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			cancelAnimationFrame(frame);
			document.removeEventListener("mousedown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	return (
		<div ref={ref} className="relative shrink-0">
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label={label}
				className="block text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]/40 rounded-2xl"
			>
				{trigger({ open })}
			</button>
			{open ? (
				<div
					role="menu"
					className="absolute z-50 mt-2 overflow-hidden rounded-2xl border bg-white"
					style={{
						[align === "end" ? "right" : "left"]: 0,
						width,
						borderColor: "var(--line-2)",
						boxShadow: "var(--sh-lg)",
						opacity: entered ? 1 : 0,
						transform: entered ? "translateY(0) scale(1)" : "translateY(-5px) scale(0.98)",
						transformOrigin: align === "end" ? "top right" : "top left",
						transition: "opacity 0.15s ease, transform 0.15s ease",
					}}
				>
					{children(() => setOpen(false))}
				</div>
			) : null}
		</div>
	);
}
