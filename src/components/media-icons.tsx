export function ScreenIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="fill-none stroke-current stroke-[1.8]">
			<rect x="3" y="4" width="18" height="13" rx="2.5" />
			<path d="M8 21h8M12 17v4M8.5 10.5 12 7l3.5 3.5M12 7v7" />
		</svg>
	);
}

export function MicIcon({ muted = false }: { muted?: boolean }) {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="fill-none stroke-current stroke-[1.8]">
			<rect x="9" y="3" width="6" height="11" rx="3" />
			<path d="M5.5 11.5A6.5 6.5 0 0 0 18 14M12 18v3M8.5 21h7" />
			{muted ? <path d="m4 4 16 16" /> : null}
		</svg>
	);
}

export function FloatIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="fill-none stroke-current stroke-[1.8]">
			<rect x="3" y="4" width="18" height="16" rx="2.5" />
			<rect x="11" y="9" width="7" height="6" rx="1.5" />
		</svg>
	);
}

export function LockIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="fill-none stroke-current stroke-[1.8]">
			<rect x="5" y="10" width="14" height="11" rx="3" />
			<path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10M12 14.5v2" />
		</svg>
	);
}
