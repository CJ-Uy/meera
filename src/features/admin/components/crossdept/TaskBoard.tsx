"use client";

import { useMemo, useState } from "react";
import { Button, Icon, Pill } from "@/components/demo/shared";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_LABELS, type DepartmentCode, type DemoTicket, type Task } from "@/features/admin/types";

const statuses: Task["status"][] = ["todo", "doing", "done"];
const statusLabels: Record<Task["status"], string> = {
	todo: "To do",
	doing: "Doing",
	done: "Done",
};

export function TaskBoard({ ticket }: { ticket: DemoTicket }) {
	const admin = useAdmin();
	const participantDepts = useMemo(() => ticket.cross?.participants.map((participant) => participant.dept) ?? [admin.activeDepartment], [admin.activeDepartment, ticket.cross]);
	const [title, setTitle] = useState("");
	const [ownerDept, setOwnerDept] = useState<DepartmentCode>(participantDepts[0] ?? admin.activeDepartment);
	const [assignee, setAssignee] = useState("");
	const trimmedTitle = title.trim();
	const assigneeOptions = admin.admins.filter((person) => person.dept === ownerDept);

	async function addTask() {
		if (!trimmedTitle) return;
		const task: Task = {
			id: `task-${Date.now()}`,
			title: trimmedTitle,
			ownerDept,
			...(assignee ? { assignee } : {}),
			status: "todo",
		};
		await admin.addTask(ticket.id, task);
		setTitle("");
		setAssignee("");
	}

	function nextStatus(status: Task["status"]) {
		const index = statuses.indexOf(status);
		return statuses[Math.min(index + 1, statuses.length - 1)];
	}

	function previousStatus(status: Task["status"]) {
		const index = statuses.indexOf(status);
		return statuses[Math.max(index - 1, 0)];
	}

	return (
		<section className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--line)" }}>
			<div className="mb-3 flex items-center gap-2">
				<Icon name="flag" size={16} className="text-[#2E9C8E]" />
				<div>
					<div className="text-sm font-[800]">Task board</div>
					<div className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>Shared cross-dept work</div>
				</div>
			</div>
			<div className="grid gap-2 rounded-2xl border bg-[#FCFAF6] p-3" style={{ borderColor: "var(--line-2)" }}>
				<input
					value={title}
					onChange={(event) => setTitle(event.target.value)}
					placeholder="Task title"
					className="rounded-xl border bg-white px-3 py-2 text-sm outline-none"
					style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}
				/>
				<div className="grid gap-2 sm:grid-cols-3">
					<select value={ownerDept} onChange={(event) => { setOwnerDept(event.target.value as DepartmentCode); setAssignee(""); }} className="rounded-xl border bg-white px-3 py-2 text-sm font-bold outline-none" style={{ borderColor: "var(--line-2)" }} aria-label="Task owner department">
						{participantDepts.map((dept) => <option key={dept} value={dept}>{DEPARTMENT_LABELS[dept]}</option>)}
					</select>
					<select value={assignee} onChange={(event) => setAssignee(event.target.value)} className="rounded-xl border bg-white px-3 py-2 text-sm font-bold outline-none sm:col-span-2" style={{ borderColor: "var(--line-2)" }} aria-label="Task assignee">
						<option value="">Unassigned</option>
						{assigneeOptions.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
					</select>
				</div>
				<div className="flex justify-end">
					<Button variant="primary" onClick={addTask} className={!trimmedTitle ? "pointer-events-none opacity-60" : ""}>
						<Icon name="check" size={14} />Add task
					</Button>
				</div>
			</div>
			<div className="mt-4 grid gap-3 xl:grid-cols-3">
				{statuses.map((status) => (
					<div key={status} className="rounded-2xl border bg-[#FCFAF6] p-3" style={{ borderColor: "var(--line-2)" }}>
						<div className="mb-2 flex items-center justify-between">
							<div className="text-sm font-[800]">{statusLabels[status]}</div>
							<Pill>{ticket.cross?.tasks.filter((task) => task.status === status).length ?? 0}</Pill>
						</div>
						<div className="grid gap-2">
							{ticket.cross?.tasks.filter((task) => task.status === status).map((task) => {
								const assigneeName = task.assignee ? admin.admins.find((person) => person.id === task.assignee)?.name : null;
								return (
									<div key={task.id} className="rounded-xl border bg-white p-3" style={{ borderColor: "var(--line)" }}>
										<div className="text-sm font-bold leading-snug">{task.title}</div>
										<div className="mt-2 flex flex-wrap gap-1.5">
											<Pill tint="teal">{DEPARTMENT_LABELS[task.ownerDept]}</Pill>
											<Pill>{assigneeName ?? "Unassigned"}</Pill>
										</div>
										<div className="mt-3 flex justify-end gap-2">
											<Button onClick={() => admin.updateTask(ticket.id, task.id, { status: previousStatus(task.status) })} className={task.status === "todo" ? "pointer-events-none opacity-50" : ""}>Back</Button>
											<Button onClick={() => admin.updateTask(ticket.id, task.id, { status: nextStatus(task.status) })} className={task.status === "done" ? "pointer-events-none opacity-50" : ""}>Next</Button>
										</div>
									</div>
								);
							})}
							{ticket.cross?.tasks.filter((task) => task.status === status).length === 0 ? (
								<div className="rounded-xl border border-dashed bg-white px-3 py-4 text-center text-sm font-bold" style={{ borderColor: "var(--line-2)", color: "var(--muted)" }}>No tasks</div>
							) : null}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
