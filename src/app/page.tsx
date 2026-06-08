import Image from "next/image";
import {
	architectureFlow,
	boundaryCards,
	comparisonRows,
	demoPrompts,
	integrations,
	meeraIconAsset,
	problemCards,
	ticketPreview,
	useCases,
	workflowSteps,
} from "@/app/home-content";

const navItems = [
	{ label: "Product", href: "#product" },
	{ label: "How It Works", href: "#workflow" },
	{ label: "Integrations", href: "#integrations" },
	{ label: "Use Cases", href: "#use-cases" },
	{ label: "Demo", href: "/demo" },
] as const;

const architectureObjects = [
	{
		title: "Student / User",
		fields: ["Name", "Email", "Student ID or employee ID", "Department or program"],
	},
	{
		title: "Concern",
		fields: ["Original message", "Category", "Responsible office", "System involved", "Urgency reason", "Priority"],
	},
	{
		title: "Ticket",
		fields: ["Title", "Summary", "Missing information", "Attempted steps", "Escalation reason", "Suggested staff action", "Status"],
	},
] as const;

function ArrowIcon() {
	return (
		<svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2" aria-hidden="true">
			<path d="M5 12h14M13 6l6 6-6 6" />
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2" aria-hidden="true">
			<path d="m5 12 4 4L19 6" />
		</svg>
	);
}

function MeeraMark({ className = "" }: { className?: string }) {
	return (
		<div
			className={`relative overflow-hidden rounded-[1.5rem] bg-[#F8E4C8] shadow-[0_20px_60px_rgba(75,43,31,0.14)] ${className}`}
		>
			<Image
				className="h-auto w-full object-contain"
				src={meeraIconAsset.src}
				alt={meeraIconAsset.alt}
				width={1500}
				height={1500}
				priority
			/>
		</div>
	);
}

function BrandIcon({ className = "" }: { className?: string }) {
	return (
		<span className={`relative inline-flex overflow-hidden rounded-2xl bg-[#F8E4C8] shadow-sm ${className}`}>
			<Image className="h-full w-full object-cover" src={meeraIconAsset.src} alt="" width={96} height={96} aria-hidden="true" />
		</span>
	);
}

function SectionHeader({
	kicker,
	title,
	tone = "default",
	children,
}: {
	kicker?: string;
	title: string;
	tone?: "default" | "dark";
	children?: React.ReactNode;
}) {
	const titleColor = tone === "dark" ? "text-white" : "text-[#4B2B1F]";

	return (
		<div className="mx-auto max-w-3xl text-center">
			{kicker ? <p className="mb-3 text-sm font-extrabold text-[#6FA334] uppercase">{kicker}</p> : null}
			<h2 className={`text-4xl font-extrabold break-words [overflow-wrap:anywhere] md:text-5xl ${titleColor}`}>{title}</h2>
			{children ? <p className="mt-5 text-base leading-8 break-words text-[#7A5036] [overflow-wrap:anywhere]">{children}</p> : null}
		</div>
	);
}

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<a
			className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#9BCF53] px-5 text-sm font-extrabold text-[#4B2B1F] shadow-[0_10px_24px_rgba(75,43,31,0.12)] transition hover:-translate-y-0.5 hover:bg-[#A9DA66] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
			href={href}
		>
			{children}
			<ArrowIcon />
		</a>
	);
}

function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<a
			className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F8E4C8] bg-white/80 px-5 text-sm font-extrabold text-[#4B2B1F] shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
			href={href}
		>
			{children}
		</a>
	);
}

function PriorityBadge({ priority }: { priority: "Low" | "Normal" | "High" | "Critical" }) {
	const styles = {
		Low: "bg-[#F3F4F6] text-[#6B7280]",
		Normal: "bg-[#EAF3FF] text-[#2563EB]",
		High: "bg-[#FFF3D6] text-[#B7791F]",
		Critical: "bg-[#FDECEC] text-[#C24141]",
	};

	return <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${styles[priority]}`}>{priority} priority</span>;
}

function Card({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`rounded-[1.75rem] border border-[#F8E4C8]/90 bg-white shadow-[0_20px_60px_rgba(75,43,31,0.08)] ${className}`}>
			{children}
		</div>
	);
}

export default function Home() {
	return (
		<main className="min-h-screen overflow-hidden bg-[#FFF8EE] text-[#4B2B1F]">
			<nav className="sticky top-0 z-50 border-b border-[#F8E4C8]/80 bg-[#FFF8EE]/86 backdrop-blur-xl">
				<div className="mx-auto flex min-h-20 w-[min(1120px,calc(100%_-_2rem))] items-center justify-between gap-4">
					<a className="flex items-center gap-3 font-extrabold text-[#4B2B1F]" href="#" aria-label="Meera home">
						<BrandIcon className="size-10" />
						<span className="text-xl">Meera</span>
					</a>
					<div className="hidden items-center gap-6 text-sm font-bold text-[#7A5036] lg:flex">
						{navItems.slice(0, -1).map((item) => (
							<a className="transition hover:text-[#4B2B1F]" href={item.href} key={item.label}>
								{item.label}
							</a>
						))}
					</div>
					<div className="flex items-center gap-2">
						<a
							className="hidden min-h-10 items-center justify-center rounded-full bg-[#4B2B1F] px-4 text-sm font-extrabold text-white transition hover:bg-[#6FA334] sm:inline-flex"
							href="/demo"
						>
							See Demo
						</a>
					</div>
				</div>
			</nav>

			<section className="relative mx-auto grid w-[min(1120px,calc(100%_-_2rem))] items-center gap-10 py-16 md:py-20 lg:grid-cols-[1fr_0.88fr]">
				<div className="min-w-0">
					<p className="mb-5 inline-block w-full max-w-full rounded-full bg-white px-4 py-2 text-center text-sm font-extrabold break-words text-[#6FA334] shadow-sm [overflow-wrap:anywhere] sm:w-auto sm:text-left">
						AI support orchestration for modern service teams
					</p>
					<h1 className="max-w-[11ch] text-4xl font-black break-words text-[#4B2B1F] [overflow-wrap:anywhere] sm:max-w-4xl sm:text-5xl md:text-7xl">
						Support that understands before it routes.
					</h1>
					<p className="mt-6 max-w-2xl text-lg leading-8 break-words text-[#7A5036]">
						Meera connects to your existing IT and operations systems, resolves common requests, and prepares structured cases when human teams need to step in.
					</p>
					<div className="mt-8 flex flex-col gap-3 sm:flex-row">
						<PrimaryButton href="/demo">See Meera in action</PrimaryButton>
						<SecondaryButton href="#integrations">View integrations</SecondaryButton>
					</div>
					<p className="mt-5 flex items-center gap-2 text-sm font-bold text-[#7A5036]">
						<span className="flex size-6 items-center justify-center rounded-full bg-[#F3FBE8] text-[#6FA334]">
							<CheckIcon />
						</span>
						Built to support staff, not replace them.
					</p>
				</div>

				<div className="grid min-w-0 max-w-full gap-3 overflow-hidden lg:relative lg:block lg:min-h-[520px]" aria-label="Meera support flow preview">
					<div className="absolute inset-x-10 top-6 hidden h-64 rounded-full bg-[#EAF3FF] blur-3xl lg:block" />
					<MeeraMark className="order-2 lg:absolute lg:right-0 lg:bottom-8 lg:left-12 lg:max-w-[380px]" />
					<Card className="order-1 p-4 lg:absolute lg:top-5 lg:left-0 lg:max-w-[280px]">
						<p className="text-xs font-extrabold text-[#6B7280]">User request</p>
						<p className="mt-2 text-sm leading-6 text-[#374151]">
							{"\"I can't access my account and I have an exam soon.\""}
						</p>
					</Card>
					<Card className="order-3 p-4 lg:absolute lg:right-0 lg:bottom-0 lg:left-auto lg:max-w-[310px]">
						<p className="text-xs font-extrabold text-[#6FA334]">Meera analysis</p>
						<div className="mt-3 grid gap-2 text-sm">
							<p className="flex flex-wrap items-center justify-between gap-2">
								<span>Intent detected</span>
								<strong>IT access issue</strong>
							</p>
							<p className="flex flex-wrap items-center justify-between gap-2">
								<span>Priority</span>
								<span className="rounded-full bg-[#FFF3D6] px-2 py-1 text-xs font-extrabold text-[#B7791F]">High</span>
							</p>
							<p className="flex flex-wrap items-center justify-between gap-2">
								<span>Next step</span>
								<strong>Troubleshoot</strong>
							</p>
							<p className="rounded-2xl bg-[#F3FBE8] px-3 py-2 text-xs font-bold text-[#6FA334]">Escalation ready if unresolved</p>
						</div>
					</Card>
				</div>
			</section>

			<section className="bg-white/55 py-20" id="product">
				<div className="mx-auto w-[min(1120px,calc(100%_-_2rem))]">
					<SectionHeader kicker="The support bottleneck" title="Support teams are buried in messy requests.">
						Requests arrive through emails, chats, forms, and messages. Staff spend time reading vague concerns, asking for missing details, classifying issues, and manually logging tickets before they can even start solving the problem.
					</SectionHeader>
					<div className="mt-12 grid gap-5 md:grid-cols-3">
						{problemCards.map((card) => (
							<Card className="p-6" key={card.title}>
								<div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2563EB]">
									<CheckIcon />
								</div>
								<h3 className="text-xl font-extrabold">{card.title}</h3>
								<p className="mt-3 text-sm leading-7 text-[#7A5036]">{card.description}</p>
							</Card>
						))}
					</div>
				</div>
			</section>

			<section className="py-20" id="workflow">
				<div className="mx-auto w-[min(1120px,calc(100%_-_2rem))]">
					<SectionHeader kicker="Solution workflow" title="Meera turns every request into the next best action." />
					<div className="mt-12 grid gap-4 lg:grid-cols-5">
						{workflowSteps.map((step, index) => (
							<Card className="relative p-5" key={step.title}>
								<span className="mb-8 flex size-10 items-center justify-center rounded-full bg-[#9BCF53] text-sm font-black text-[#4B2B1F]">
									{index + 1}
								</span>
								<h3 className="text-xl font-extrabold">{step.title}</h3>
								<p className="mt-3 text-sm leading-7 text-[#7A5036]">{step.description}</p>
							</Card>
						))}
					</div>
				</div>
			</section>

			<section className="bg-[#4B2B1F] py-20 text-white" id="demo-preview">
				<div className="mx-auto w-[min(1120px,calc(100%_-_2rem))]">
					<SectionHeader kicker="Demo preview" title="One friendly chat. One complete staff handoff." tone="dark">
						<span className="text-[#F8E4C8]">Meera keeps the user experience warm while preparing the structured context staff need.</span>
					</SectionHeader>
					<div className="mt-12 grid gap-5 lg:grid-cols-3">
						<Card className="bg-[#FFF8EE] p-5">
							<h3 className="text-xl font-extrabold">User Chat</h3>
							<div className="mt-5 grid gap-3 text-sm leading-6">
								<p className="rounded-[1.25rem] rounded-br-md border border-[#F3F4F6] bg-white p-4 text-[#374151]">I paid my tuition already but it still says unpaid.</p>
								<p className="rounded-[1.25rem] rounded-bl-md border border-[#9BCF53]/35 bg-[#F3FBE8] p-4 text-[#4B2B1F]">
									I can help prepare this for Finance. I won&apos;t validate the payment myself, but I can collect the details staff need to verify it.
								</p>
							</div>
						</Card>
						<Card className="bg-white p-5">
							<h3 className="text-xl font-extrabold">Meera Analysis</h3>
							<div className="mt-5 grid gap-3 text-sm text-[#374151]">
								{[
									["Responsible Office", ticketPreview.office],
									["Category", ticketPreview.category],
									["Escalation reason", ticketPreview.escalationReason],
									["Needed details", "Student ID, term, payment date, channel, proof of payment"],
								].map(([label, value]) => (
									<p className="m-0 border-b border-[#F3F4F6] pb-3" key={label}>
										<span className="block text-xs font-extrabold text-[#6B7280]">{label}</span>
										<strong className="font-bold text-[#4B2B1F]">{value}</strong>
									</p>
								))}
							</div>
						</Card>
						<Card className="bg-white p-5">
							<div className="flex items-start justify-between gap-4">
								<h3 className="text-xl font-extrabold">Staff Ticket</h3>
								<PriorityBadge priority={ticketPreview.priority} />
							</div>
							<div className="mt-5 grid gap-3 text-sm leading-6 text-[#7A5036]">
								<p>
									<strong className="block text-[#4B2B1F]">{ticketPreview.title}</strong>
									{ticketPreview.summary}
								</p>
								<p className="rounded-2xl bg-[#EAF3FF] p-3 font-bold text-[#2563EB]">{ticketPreview.suggestedAction}</p>
							</div>
						</Card>
					</div>
				</div>
			</section>

			<section className="py-20" id="integrations">
				<div className="mx-auto grid w-[min(1120px,calc(100%_-_2rem))] items-center gap-10 lg:grid-cols-[0.8fr_1fr]">
					<div>
						<p className="mb-3 inline-flex rounded-full bg-[#EAF3FF] px-4 py-2 text-sm font-extrabold text-[#2563EB]">No rip-and-replace required</p>
						<h2 className="text-4xl font-extrabold md:text-5xl">Works with the systems your teams already use.</h2>
						<p className="mt-5 text-base leading-8 text-[#7A5036]">
							Meera acts as an AI support layer that can connect to knowledge bases, workflows, ticketing systems, email, dashboards, and Microsoft-based automation.
						</p>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						{integrations.map((integration) => (
							<Card className="p-4" key={integration.name}>
								<h3 className="text-base font-extrabold">{integration.name}</h3>
								<p className="mt-2 text-sm leading-6 text-[#7A5036]">{integration.description}</p>
							</Card>
						))}
					</div>
				</div>
			</section>

			<section className="bg-white/55 py-20" id="use-cases">
				<div className="mx-auto w-[min(1120px,calc(100%_-_2rem))]">
					<SectionHeader kicker="Use cases" title="Built for support teams across the organization." />
					<div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
						{useCases.map((useCase) => (
							<Card className="p-6" key={useCase.title}>
								<h3 className="text-xl font-extrabold">{useCase.title}</h3>
								<p className="mt-3 text-sm leading-7 text-[#7A5036]">{useCase.description}</p>
								<div className="mt-5 flex flex-wrap gap-2">
									{useCase.examples.map((example) => (
										<span className="rounded-full bg-[#FFF8EE] px-3 py-1 text-xs font-bold text-[#7A5036]" key={example}>
											{example}
										</span>
									))}
								</div>
							</Card>
						))}
					</div>
				</div>
			</section>

			<section className="py-20">
				<div className="mx-auto w-[min(1120px,calc(100%_-_2rem))]">
					<SectionHeader kicker="Differentiation" title="More than a chatbot. More useful than a form." />
					<div className="mt-12 overflow-hidden rounded-[1.75rem] border border-[#F8E4C8] bg-white shadow-[0_20px_60px_rgba(75,43,31,0.08)]">
						<div className="grid grid-cols-2 bg-[#F8E4C8]/55 p-4 text-sm font-extrabold">
							<p>Basic form or chatbot</p>
							<p>Meera</p>
						</div>
						{comparisonRows.map(([basic, meera]) => (
							<div className="grid gap-4 border-t border-[#F8E4C8]/80 p-4 text-sm leading-6 md:grid-cols-2" key={basic}>
								<p className="text-[#7A5036]">{basic}</p>
								<p className="font-bold text-[#4B2B1F]">{meera}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="bg-[#F3FBE8] py-20">
				<div className="mx-auto grid w-[min(1120px,calc(100%_-_2rem))] items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
					<div>
						<p className="mb-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#6FA334]">Human-in-the-loop by design</p>
						<h2 className="text-4xl font-extrabold md:text-5xl">Helpful by default. Careful when it matters.</h2>
						<p className="mt-5 text-base leading-8 text-[#7A5036]">
							Meera provides safe guidance for common issues and escalates when a request requires approval, verification, policy judgment, sensitive review, or system access.
						</p>
						<div className="mt-8 grid gap-3 sm:grid-cols-2">
							{boundaryCards.map((boundary) => (
								<p className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-[#4B2B1F] shadow-sm" key={boundary}>
									<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2563EB]">
										<CheckIcon />
									</span>
									{boundary}
								</p>
							))}
						</div>
					</div>
					<MeeraMark className="mx-auto w-full max-w-[360px]" />
				</div>
			</section>

			<section className="py-20">
				<div className="mx-auto w-[min(1120px,calc(100%_-_2rem))]">
					<SectionHeader kicker="Architecture preview" title="Designed as an agentic support layer." />
					<div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1fr]">
						<Card className="p-5">
							<div className="grid gap-3">
								{architectureFlow.map((step, index) => (
									<div className="flex items-center gap-3" key={step}>
										<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EAF3FF] text-xs font-black text-[#2563EB]">
											{index + 1}
										</span>
										<p className="min-h-10 flex-1 rounded-2xl bg-[#FFF8EE] px-4 py-2 text-sm font-bold">{step}</p>
									</div>
								))}
							</div>
						</Card>
						<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
							{architectureObjects.map((object) => (
								<Card className="p-5" key={object.title}>
									<h3 className="text-xl font-extrabold">{object.title}</h3>
									<div className="mt-4 flex flex-wrap gap-2">
										{object.fields.map((field) => (
											<span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-bold text-[#6B7280]" key={field}>
												{field}
											</span>
										))}
									</div>
								</Card>
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="bg-white/55 py-20">
				<div className="mx-auto grid w-[min(1120px,calc(100%_-_2rem))] items-center gap-10 lg:grid-cols-[0.9fr_1fr]">
					<Card className="p-6">
						<h2 className="text-4xl font-extrabold">See how Meera handles real support concerns.</h2>
						<p className="mt-5 text-base leading-8 text-[#7A5036]">
							Try prompts for account lockouts, payment posting concerns, registration holds, Wi-Fi issues, medical documentation, and ID access.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<PrimaryButton href="/demo">Launch Demo</PrimaryButton>
							<SecondaryButton href="#demo-preview">View Sample Tickets</SecondaryButton>
						</div>
					</Card>
					<div className="grid gap-3">
						{demoPrompts.map((prompt) => (
								<p
									className="rounded-[1.25rem] border border-[#F8E4C8] bg-white px-5 py-4 text-sm font-bold text-[#4B2B1F] shadow-sm"
									key={prompt}
								>
									{`"${prompt}"`}
								</p>
						))}
					</div>
				</div>
			</section>

			<section className="px-4 py-20">
				<div className="mx-auto flex max-w-5xl flex-col items-center rounded-[2rem] bg-[#4B2B1F] p-10 text-center text-white shadow-[0_20px_60px_rgba(75,43,31,0.2)] md:p-14">
					<h2 className="max-w-3xl text-4xl font-extrabold md:text-6xl">Make support easier to ask for and easier to handle.</h2>
					<p className="mt-5 max-w-2xl text-base leading-8 text-[#F8E4C8]">
						Deploy Meera as your AI support front door and turn messy requests into resolved answers or ready-to-act cases.
					</p>
					<div className="mt-8 flex flex-col gap-3 sm:flex-row">
						<PrimaryButton href="/demo">Get Started</PrimaryButton>
						<SecondaryButton href="mailto:team@example.com">Contact the Team</SecondaryButton>
					</div>
				</div>
			</section>

			<footer className="border-t border-[#F8E4C8] py-10">
				<div className="mx-auto flex w-[min(1120px,calc(100%_-_2rem))] flex-col gap-6 md:flex-row md:items-center md:justify-between">
					<div>
						<a className="flex items-center gap-3 font-extrabold" href="#">
							<BrandIcon className="size-9" />
							Meera
						</a>
						<p className="mt-3 max-w-md text-sm leading-6 text-[#7A5036]">
							Meera is an AI support companion built to help service teams resolve faster, escalate smarter, and reduce repetitive intake work.
						</p>
					</div>
					<div className="flex flex-wrap gap-4 text-sm font-bold text-[#7A5036]">
						<a href="#product">Product</a>
						<a href="#integrations">Integrations</a>
						<a href="/demo">Demo</a>
						<a href="mailto:team@example.com">Contact</a>
					</div>
				</div>
			</footer>
		</main>
	);
}
