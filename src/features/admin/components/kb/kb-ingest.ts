import type { DemoTicket, KbNode } from "@/features/admin/types";

export type KbIngestKind = Extract<KbNode["kind"], "faq" | "procedure">;

export type KbIngestDraft = {
	kind: KbIngestKind;
	label: string;
	body: string;
	askFor: string;
	escalateIf: string;
};

function actionsToBody(actions: string[]) {
	return actions.length > 0 ? actions.join("\n") : "Document the recommended response for future similar tickets.";
}

export function buildKbIngestDraft(ticket: Pick<DemoTicket, "title" | "aiSummary" | "missingInformation" | "suggestedActions">): KbIngestDraft {
	return {
		kind: "faq",
		label: ticket.title || ticket.aiSummary,
		body: actionsToBody(ticket.suggestedActions),
		askFor: ticket.missingInformation,
		escalateIf: ticket.aiSummary,
	};
}

export function buildKbNodeFromDraft(ticket: Pick<DemoTicket, "id" | "ownerDept">, draft: KbIngestDraft): KbNode {
	const suffix = ticket.id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
	return {
		id: `kb-${suffix}-${Date.now()}`,
		dept: ticket.ownerDept,
		kind: draft.kind,
		label: draft.label.trim(),
		body: draft.body.trim(),
		meta: {
			sourceTicketId: ticket.id,
			askFor: draft.askFor.trim(),
			escalateIf: draft.escalateIf.trim(),
		},
	};
}
