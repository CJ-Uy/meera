"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LockIcon } from "@/components/media-icons";
import { MediaControls } from "@/components/media-controls";
import { PermissionStatus } from "@/components/permission-status";
import { ScreenPreview } from "@/components/screen-preview";
import { SharingBadge } from "@/components/sharing-badge";
import { adminDemoFallback, type AdminDemoSnapshot, type AdminDepartment, type DepartmentCode, type DepartmentFaq } from "@/features/admin/admin-demo-data";
import { OverlaySimulator } from "@/features/overlay/overlay-simulator";
import { useMediaSession } from "@/hooks/use-media-session";

type DemoView = "student" | "admin";
type MediaSession = ReturnType<typeof useMediaSession>;

const demoTabs: { id: DemoView; label: string; helper: string }[] = [
	{ id: "student", label: "Student / Inquirer", helper: "What the person asking for help sees" },
	{ id: "admin", label: "Admin", helper: "How teams triage and route the ticket" },
];
const adminDemoApiBase = process.env.NEXT_PUBLIC_ADMIN_DEMO_API_BASE?.replace(/\/$/, "") ?? "";

function isAdminDemoSnapshot(value: unknown): value is AdminDemoSnapshot {
	return typeof value === "object" && value !== null && "departments" in value && Array.isArray((value as { departments?: unknown }).departments);
}

export function SupportStudio() {
	const session = useMediaSession();
	const isSharing = session.screenState === "active";
	const [activeView, setActiveView] = useState<DemoView>("student");

	return (
		<main className="mx-auto min-h-screen w-[min(1180px,calc(100%_-_2.5rem))] pb-16">
			<header className="flex items-center justify-between border-b border-slate-200 py-5">
				<Link className="text-lg font-bold text-slate-900 no-underline" href="/" aria-label="Meera home">
					meera
				</Link>
				<div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
					<span className="size-3.5">
						<LockIcon />
					</span>
					<span className="hidden sm:inline">Private support session</span>
				</div>
			</header>

			<div className="pt-8">
				<div
					className="inline-grid w-full grid-cols-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm sm:w-auto"
					role="tablist"
					aria-label="Demo views"
				>
					{demoTabs.map((tab) => {
						const isActive = activeView === tab.id;

						return (
							<button
								key={tab.id}
								id={`tab-${tab.id}`}
								type="button"
								role="tab"
								aria-selected={isActive}
								aria-controls={`${tab.id}-panel`}
								className={`rounded-full px-4 py-2.5 text-left text-xs font-bold transition sm:min-w-48 ${
									isActive ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
								}`}
								onClick={() => setActiveView(tab.id)}
							>
								<span className="block">{tab.label}</span>
								<span className={`hidden text-[10px] font-medium sm:block ${isActive ? "text-slate-300" : "text-slate-400"}`}>
									{tab.helper}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{activeView === "student" ? <StudentInquirerView session={session} /> : <AdminDepartmentView />}

			{session.mediaError ? (
				<div
					className="fixed top-4 left-1/2 z-60 flex max-w-[calc(100%_-_2rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 pl-3 text-[11px] shadow-xl"
					role="alert"
				>
					<span>{session.mediaError}</span>
					<button
						type="button"
						className="min-h-7 rounded-md bg-slate-100 px-2 text-[9px] font-bold hover:bg-slate-200"
						onClick={session.clearMediaError}
					>
						Close
					</button>
				</div>
			) : null}

			{isSharing ? (
				<SharingBadge
					supportsCompanion={session.supportsCompanion}
					onOpenCompanion={session.openCompanion}
					onStopSharing={session.stopScreenShare}
				/>
			) : null}
		</main>
	);
}

function StudentInquirerView({ session }: { session: MediaSession }) {
	const isSharing = session.screenState === "active";
	const isMicLive = session.micState === "active";

	return (
		<section id="student-panel" role="tabpanel" aria-labelledby="tab-student">
			<section className="max-w-3xl pt-14 pb-7">
				<p className="mb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Support session prototype</p>
				<h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
					Screen sharing and microphone access
				</h1>
				<p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
					Start either permission independently. Your browser remains the source of truth for what is active.
				</p>
			</section>

			<MediaControls
				screenState={session.screenState}
				micState={session.micState}
				onToggleScreen={isSharing ? session.stopScreenShare : session.startScreenShare}
				onToggleMic={session.toggleMicrophone}
			/>

			<p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
				<span className="size-3.5">
					<LockIcon />
				</span>
				Nothing starts until you grant browser permission. Stop either permission at any time.
			</p>

			<section className="mt-12">
				<div className="mb-3 flex items-center justify-between">
					<h2 className="text-lg font-semibold">Live preview</h2>
					<div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
						<span
							className={`size-2 rounded-full ${isSharing || isMicLive ? "bg-emerald-500 ring-4 ring-emerald-500/10" : "bg-slate-300"}`}
						/>
						{isSharing || isMicLive ? "Session active" : "Waiting to begin"}
					</div>
				</div>

				<div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
					<ScreenPreview
						isSharing={isSharing}
						isCompanionOpen={session.isCompanionOpen}
						supportsCompanion={session.supportsCompanion}
						previewRef={session.previewRef}
						onStartSharing={session.startScreenShare}
						onStopSharing={session.stopScreenShare}
						onOpenCompanion={session.openCompanion}
					/>
					<div className="grid content-start gap-3">
						<PermissionStatus
							screenState={session.screenState}
							micState={session.micState}
							micMeterRef={session.micMeterRef}
						/>
						<OverlaySimulator />
					</div>
				</div>
			</section>
		</section>
	);
}

function AdminDepartmentView() {
	const [departments, setDepartments] = useState(adminDemoFallback.departments);
	const [dataSource, setDataSource] = useState(adminDemoFallback.source);
	const [activeDepartmentCode, setActiveDepartmentCode] = useState<DepartmentCode>("IT");
	const [selectedFaqId, setSelectedFaqId] = useState(departments[0].faqs[0].id);
	const [draftSaved, setDraftSaved] = useState(false);
	const activeDepartment = departments.find((department) => department.code === activeDepartmentCode) ?? departments[0];
	const selectedFaq = activeDepartment.faqs.find((faq) => faq.id === selectedFaqId) ?? activeDepartment.faqs[0];
	const selectedTicket = activeDepartment.tickets[0];

	useEffect(() => {
		let isMounted = true;

		fetch(`${adminDemoApiBase}/api/admin-demo`)
			.then((response) => (response.ok ? response.json() : Promise.reject(new Error("Admin demo API unavailable"))))
			.then((snapshot: unknown) => {
				if (!isMounted) return;
				const nextSnapshot = isAdminDemoSnapshot(snapshot) ? snapshot : adminDemoFallback;
				setDepartments(nextSnapshot.departments);
				setDataSource(nextSnapshot.source);
				setActiveDepartmentCode(nextSnapshot.departments[0]?.code ?? "IT");
				setSelectedFaqId(nextSnapshot.departments[0]?.faqs[0]?.id ?? "KA_WIFI_BASIC");
			})
			.catch(() => {
				if (!isMounted) return;
				setDepartments(adminDemoFallback.departments);
				setDataSource(adminDemoFallback.source);
			});

		return () => {
			isMounted = false;
		};
	}, []);

	function selectDepartment(code: DepartmentCode) {
		const nextDepartment = departments.find((department) => department.code === code) ?? departments[0];
		setActiveDepartmentCode(code);
		setSelectedFaqId(nextDepartment.faqs[0].id);
		setDraftSaved(false);
	}

	function updateFaq(field: keyof Pick<DepartmentFaq, "answer" | "askFor" | "escalateIf">, value: string) {
		setDepartments((current) =>
			current.map((department) =>
				department.code === activeDepartment.code
					? {
							...department,
							faqs: department.faqs.map((faq) => (faq.id === selectedFaq.id ? { ...faq, [field]: value } : faq)),
						}
					: department,
			),
		);
		setDraftSaved(false);
	}

	function saveFaqDraft() {
		setDraftSaved(true);
		void fetch(`${adminDemoApiBase}/api/admin-demo`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				departmentCode: activeDepartment.code,
				faqId: selectedFaq.id,
				answer: selectedFaq.answer,
				askFor: selectedFaq.askFor,
				escalateIf: selectedFaq.escalateIf,
			}),
		}).catch(() => {
			setDraftSaved(false);
		});
	}

	return (
		<section id="admin-panel" role="tabpanel" aria-labelledby="tab-admin" className="pt-9">
			<div className="overflow-hidden rounded-[30px] border border-[#EAE0D1] bg-[#FBF6EE] shadow-[0_30px_70px_-42px_rgba(28,51,73,.35)]">
				<div className="border-b border-[#EAE0D1] bg-white/70 p-5">
					<p className="mb-2 font-['DM_Mono'] text-[11px] font-bold uppercase tracking-[0.14em] text-[#2E9C8E]">Admin mini CMS · D1-ready</p>
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div>
							<h1 className="text-3xl font-black tracking-normal text-[#1C3349] sm:text-4xl">Department workspaces for FAQs and tickets.</h1>
							<p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
								Each panel uses the same support intelligence pattern from the home page: Meera answers safe FAQs, packages escalations, and gives staff a clean place to edit knowledge and respond.
							</p>
						</div>
						<span className="rounded-full border border-[#D7C7B5] bg-white px-3 py-1.5 font-['DM_Mono'] text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
							Source: {dataSource === "fallback" ? "docs + CSV fallback" : "Cloudflare D1"}
						</span>
					</div>
				</div>

				<div className="grid gap-5 p-5 lg:grid-cols-[250px_minmax(0,1fr)]">
					<aside className="grid content-start gap-2">
						<p className="px-1 font-['DM_Mono'] text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Department views</p>
						{departments.map((department) => (
							<button
								key={department.code}
								type="button"
								className={`rounded-2xl border p-4 text-left transition ${
									activeDepartment.code === department.code
										? `${accentClasses(department).tab} shadow-[0_16px_34px_-24px_rgba(28,51,73,.42)]`
										: "border-[#EAE0D1] bg-white text-slate-600 hover:border-[#D7C7B5]"
								}`}
								onClick={() => selectDepartment(department.code)}
							>
								<span className="block text-[15px] font-black">{department.name}</span>
								<span className="mt-1 block text-[11px] leading-5 opacity-75">{department.tickets.length} ticket · {department.faqs.length} FAQs</span>
							</button>
						))}
					</aside>

					<div className="grid gap-5">
						<DepartmentOverview department={activeDepartment} />
						<div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
							<div className="grid gap-5">
								<FaqEditor
									department={activeDepartment}
									selectedFaq={selectedFaq}
									selectedFaqId={selectedFaqId}
									draftSaved={draftSaved}
									onSelectFaq={setSelectedFaqId}
									onUpdateFaq={updateFaq}
									onSaveDraft={saveFaqDraft}
								/>
							</div>
							<TicketWorkspace department={activeDepartment} ticket={selectedTicket} />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function DepartmentOverview({ department }: { department: AdminDepartment }) {
	return (
		<section className={`rounded-[26px] border p-5 ${accentClasses(department).panel}`}>
			<div className="grid gap-5 lg:grid-cols-[minmax(0,.88fr)_minmax(0,1.12fr)]">
				<div>
					<p className="font-['DM_Mono'] text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">Ticket flow</p>
					<h2 className="mt-2 text-2xl font-black tracking-normal">{department.name}</h2>
					<p className="mt-3 text-sm leading-6 opacity-80">{department.agentValue}</p>
				</div>
				<div className="grid gap-2">
					{department.responsibilities.map((responsibility) => (
						<div key={responsibility} className="flex gap-2 rounded-2xl bg-white/58 p-3 text-sm leading-6">
							<span className="mt-2 size-1.5 shrink-0 rounded-full bg-current" />
							<span>{responsibility}</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function FaqEditor({
	department,
	selectedFaq,
	selectedFaqId,
	draftSaved,
	onSelectFaq,
	onUpdateFaq,
	onSaveDraft,
}: {
	department: AdminDepartment;
	selectedFaq: DepartmentFaq;
	selectedFaqId: string;
	draftSaved: boolean;
	onSelectFaq: (id: string) => void;
	onUpdateFaq: (field: keyof Pick<DepartmentFaq, "answer" | "askFor" | "escalateIf">, value: string) => void;
	onSaveDraft: () => void;
}) {
	return (
		<section className="rounded-[26px] border border-[#EAE0D1] bg-white p-5 shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="font-['DM_Mono'] text-[10px] font-bold uppercase tracking-[0.12em] text-[#2E9C8E]">FAQ editor</p>
					<h2 className="mt-1 text-xl font-black text-[#1C3349]">Knowledge base for {department.shortName}</h2>
				</div>
				<span className="rounded-full bg-[#F5EADD] px-3 py-1 text-[11px] font-bold text-[#8A5D36]">aic_knowledge_article</span>
			</div>

			<div className="mt-4 grid gap-2">
				{department.faqs.map((faq) => (
					<button
						key={faq.id}
						type="button"
						className={`rounded-2xl border p-3 text-left text-sm transition ${
							selectedFaqId === faq.id ? "border-[#2E9C8E] bg-[#E8F7F3] text-[#1C3349]" : "border-[#EAE0D1] bg-[#FCFAF6] text-slate-600 hover:border-[#D7C7B5]"
						}`}
						onClick={() => onSelectFaq(faq.id)}
					>
						<span className="font-bold">{faq.question}</span>
						<span className="mt-1 block font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em] text-slate-400">
							{faq.id} · verified {faq.lastVerified}
						</span>
					</button>
				))}
			</div>

			<div className="mt-4 grid gap-3">
				<label className="grid gap-1.5 text-xs font-bold text-slate-500">
					Edit answer
					<textarea className="min-h-28 rounded-2xl border border-[#EAE0D1] bg-[#FCFAF6] p-3 text-sm font-medium leading-6 text-slate-800 outline-none focus:border-[#2E9C8E]" value={selectedFaq.answer} onChange={(event) => onUpdateFaq("answer", event.target.value)} />
				</label>
				<label className="grid gap-1.5 text-xs font-bold text-slate-500">
					Ask for
					<textarea className="min-h-20 rounded-2xl border border-[#EAE0D1] bg-[#FCFAF6] p-3 text-sm font-medium leading-6 text-slate-800 outline-none focus:border-[#2E9C8E]" value={selectedFaq.askFor} onChange={(event) => onUpdateFaq("askFor", event.target.value)} />
				</label>
				<label className="grid gap-1.5 text-xs font-bold text-slate-500">
					Escalate if
					<textarea className="min-h-20 rounded-2xl border border-[#EAE0D1] bg-[#FCFAF6] p-3 text-sm font-medium leading-6 text-slate-800 outline-none focus:border-[#2E9C8E]" value={selectedFaq.escalateIf} onChange={(event) => onUpdateFaq("escalateIf", event.target.value)} />
				</label>
			</div>

			<div className="mt-4 flex flex-wrap items-center gap-3">
				<button type="button" className="rounded-full bg-[#2E9C8E] px-5 py-2.5 text-sm font-black text-white shadow-[0_12px_26px_rgba(46,156,142,.22)]" onClick={onSaveDraft}>
					Save draft
				</button>
				<span className="text-xs font-medium text-slate-500">{draftSaved ? "Draft saved in this demo session." : "Edits are staged for D1 persistence."}</span>
			</div>
		</section>
	);
}

function TicketWorkspace({ department, ticket }: { department: AdminDepartment; ticket: AdminDepartment["tickets"][number] }) {
	return (
		<section className="grid gap-4">
			<div className="rounded-[26px] border border-[#EAE0D1] bg-white p-5 shadow-sm">
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="font-['DM_Mono'] text-[10px] font-bold uppercase tracking-[0.12em] text-[#2E9C8E]">Ticket queue</p>
						<h2 className="mt-1 text-xl font-black text-[#1C3349]">{department.shortName} tickets</h2>
					</div>
					<span className="rounded-full bg-[#EFF4F1] px-3 py-1 text-[11px] font-bold text-slate-600">aic_support_ticket</span>
				</div>

				<div className="rounded-2xl border border-[#EAE0D1] bg-[#FCFAF6] p-4">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p className="font-['DM_Mono'] text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{ticket.id}</p>
							<h3 className="mt-1 text-lg font-black text-[#1C3349]">{ticket.title}</h3>
							<p className="mt-1 text-xs font-medium text-slate-500">{ticket.student}</p>
						</div>
						<div className="flex gap-2">
							<span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600">{ticket.status}</span>
							<span className="rounded-full bg-[#FBE7E0] px-2.5 py-1 text-[11px] font-bold text-[#C0532F]">{ticket.priority}</span>
						</div>
					</div>
					<div className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
						<p><strong>Summary:</strong> {ticket.issueSummary}</p>
						<p><strong>Collected:</strong> {ticket.collectedInformation}</p>
						<p><strong>Missing:</strong> {ticket.missingInformation}</p>
						<p><strong>Suggested action:</strong> {ticket.suggestedStaffAction}</p>
					</div>
					<div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E7EEEC]">
						<div className="h-full rounded-full bg-[#2E9C8E]" style={{ width: `${Math.round(ticket.confidence * 100)}%` }} />
					</div>
					<p className="mt-1 font-['DM_Mono'] text-[10px] text-slate-400">AI confidence {Math.round(ticket.confidence * 100)}%</p>
				</div>
			</div>

			<div className="rounded-[26px] border border-[#1C3349] bg-[#1C3349] p-5 text-white shadow-[0_24px_52px_-30px_rgba(28,51,73,.75)]">
				<p className="font-['DM_Mono'] text-[10px] font-bold uppercase tracking-[0.12em] text-[#9FE3D6]">Response composer</p>
				<h2 className="mt-1 text-xl font-black">Answer with full context</h2>
				<p className="mt-3 text-sm leading-6 text-slate-300">{ticket.conversationSummary}</p>
				<textarea
					className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-sm leading-6 text-white outline-none placeholder:text-slate-400 focus:border-[#9FE3D6]"
					defaultValue={`Hi, thanks for the details. ${ticket.suggestedStaffAction}`}
				/>
				<div className="mt-3 flex flex-wrap gap-2">
					<button type="button" className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#1C3349]">Send reply</button>
					<button type="button" className="rounded-full border border-white/20 px-4 py-2 text-xs font-black text-white">Assign</button>
					<button type="button" className="rounded-full border border-white/20 px-4 py-2 text-xs font-black text-white">Resolve</button>
				</div>
			</div>
		</section>
	);
}

function accentClasses(department: AdminDepartment) {
	const map = {
		teal: { tab: "border-[#9FDCD3] bg-[#E8F7F3] text-[#176E63]", panel: "border-[#9FDCD3] bg-[#E8F7F3] text-[#176E63]" },
		sand: { tab: "border-[#E6CDAA] bg-[#FBF1E4] text-[#8A5D36]", panel: "border-[#E6CDAA] bg-[#FBF1E4] text-[#8A5D36]" },
		green: { tab: "border-[#CDE4B8] bg-[#F0F7EA] text-[#5E7F3B]", panel: "border-[#CDE4B8] bg-[#F0F7EA] text-[#5E7F3B]" },
		rose: { tab: "border-[#F0CBBE] bg-[#FBE7E0] text-[#9B4C32]", panel: "border-[#F0CBBE] bg-[#FBE7E0] text-[#9B4C32]" },
	};

	return map[department.accent];
}
