import Link from "next/link";

const asset = (name: string) => `/assets/${name}`;

const options = [
	{
		href: "/demo/student",
		emoji: "🎓",
		title: "Student",
		body: "Chat with the real Meera — it classifies your concern, files a staff-ready ticket, and you can try the Battle mode too.",
		cta: "Open student demo",
		tint: "var(--teal)",
	},
	{
		href: "/demo/admin",
		emoji: "🛠️",
		title: "Staff / Admin",
		body: "See how Meera triages tickets, surfaces root causes, and routes work across departments.",
		cta: "Open admin demo",
		tint: "var(--sand-600)",
	},
];

export default function DemoChooserPage() {
	return (
		<main className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6" style={{ background: "var(--cream)", color: "var(--ink)" }}>
			<Link href="/" className="absolute left-5 top-5 inline-flex items-center gap-2 text-[14px] font-semibold" style={{ color: "var(--ink-2)" }} aria-label="Meera home">
				<img src={asset("meera-avatar.png")} alt="" className="size-7 rounded-full" style={{ background: "linear-gradient(160deg,#FBEADD,#F4D9C2)" }} />
				Meera
			</Link>

			<img src={asset("meera-wave.png")} alt="Meera waving" className="mb-5 w-24" />
			<h1 className="text-center text-3xl font-[800] tracking-[-0.03em] md:text-4xl">Who&apos;s here today?</h1>
			<p className="mt-3 max-w-md text-center text-base leading-7" style={{ color: "var(--ink-2)" }}>Pick a view to explore the demo. Both are interactive mockups.</p>

			<div className="mt-9 grid w-full max-w-[760px] gap-4 sm:grid-cols-2">
				{options.map((option) => (
					<Link
						key={option.href}
						href={option.href}
						className="group flex flex-col rounded-[24px] border bg-white p-6 text-left transition hover:-translate-y-1"
						style={{ borderColor: "var(--line)", boxShadow: "var(--sh-md)" }}
					>
						<span className="grid size-12 place-items-center rounded-2xl text-2xl" style={{ background: "var(--cream-2)" }}>{option.emoji}</span>
						<span className="mt-4 text-xl font-[800]">{option.title}</span>
						<span className="mt-2 flex-1 text-sm leading-6" style={{ color: "var(--ink-2)" }}>{option.body}</span>
						<span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: option.tint }}>
							{option.cta}
							<span className="transition group-hover:translate-x-0.5">→</span>
						</span>
					</Link>
				))}
			</div>
		</main>
	);
}
