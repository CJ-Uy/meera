import { z } from "zod";
import { DEPARTMENT_CODES } from "@/features/admin/types";

export const departmentSchema = z.enum(DEPARTMENT_CODES);
export const severitySchema = z.enum(["Low", "Medium", "High", "Critical"]);
export const complexitySchema = z.enum(["Low", "Medium", "High"]);
export const ticketStatusSchema = z.enum(["New", "In progress", "Awaiting student", "Resolved"]);
export const crossDeptDecisionSchema = z.enum(["accepted", "rejected"]);

export const actingAdminSchema = z.object({
	actingAdminId: z.string().min(1),
});

export const adminNoteSchema = z.object({
	id: z.string().min(1),
	adminId: z.string().min(1),
	text: z.string().min(1),
	at: z.number(),
});

export const kbNodeSchema = z.object({
	id: z.string().min(1),
	dept: z.union([departmentSchema, z.literal("shared")]),
	kind: z.enum(["faq", "procedure", "entity", "department"]),
	label: z.string().min(1),
	body: z.string().optional(),
	meta: z.record(z.string(), z.string()).optional(),
});

export const kbEdgeSchema = z.object({
	id: z.string().min(1),
	from: z.string().min(1),
	to: z.string().min(1),
	relation: z.string().min(1),
});

export const taskSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	ownerDept: departmentSchema,
	assignee: z.string().optional(),
	status: z.enum(["todo", "doing", "done"]),
	due: z.number().optional(),
});

export const ticketPatchSchema = z.object({
	title: z.string().min(1).optional(),
	student: z.string().min(1).optional(),
	ownerDept: departmentSchema.optional(),
	tag: z.string().min(1).optional(),
	severity: severitySchema.optional(),
	complexity: complexitySchema.optional(),
	status: ticketStatusSchema.optional(),
	createdAt: z.number().optional(),
	aiSummary: z.string().optional(),
	collectedInformation: z.string().optional(),
	missingInformation: z.string().optional(),
	suggestedActions: z.array(z.string()).optional(),
	confidence: z.number().min(0).max(1).optional(),
	claimedBy: z.string().nullable().optional(),
	edited: z.boolean().optional(),
	kbIngested: z.boolean().optional(),
});

export const claimTicketSchema = z.object({ adminId: z.string().min(1) });
export const addNoteSchema = z.object({ note: adminNoteSchema });
export const setSeveritySchema = z.object({ severity: severitySchema });
export const setComplexitySchema = z.object({ complexity: complexitySchema });
export const updateTicketSchema = z.object({ patch: ticketPatchSchema });
export const ingestKbSchema = z.object({ node: kbNodeSchema });
export const createKbNodeSchema = z.object({ node: kbNodeSchema, edges: z.array(kbEdgeSchema) });
export const escalateCrossDeptSchema = z.object({ depts: z.array(departmentSchema).min(1), by: z.union([z.literal("ai"), z.string().min(1)]), reason: z.string().min(1) });
export const respondCrossDeptSchema = z.object({ dept: departmentSchema, decision: crossDeptDecisionSchema, reason: z.string().optional() });
export const addTaskSchema = z.object({ task: taskSchema });
export const updateTaskSchema = z.object({ patch: taskSchema.partial() });

export function withActingAdmin<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
	return schema.extend(actingAdminSchema.shape);
}
