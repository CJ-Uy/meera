import type { AiChatInputMessage, AiToolCall } from "@/features/ai/ai-types";
import { candidateById, candidateToOverlayToolCall, renderCandidatesForPrompt } from "@/features/ai/grounding/candidates";
import { isOverlayAction, type GroundingCandidate, type OverlaySelection } from "@/features/ai/grounding/types";

/**
 * Element selection: a TEXT model (no coordinate regression) reads the user's request and the list of
 * detected on-screen elements, then names the element to mark and how. The chosen candidate's rect — not
 * the model — supplies the coordinates.
 */

export const SELECTION_SYSTEM_PROMPT = `
You are Meera's overlay targeting brain. You are given the user's request and a numbered list of
elements detected on their screen (each with an id, its visible text, and a rough position).

Choose the single element the user means and how to mark it, then call select_overlay_target:
- action "arrow": point at one thing. Default for "point at", "where is", "where do I click", picking one item.
- action "highlight": draw a box around a region. Use for "highlight", "box", "outline", "circle", "focus on".
- action "bubble": show a short text note at a spot. Use for "label", "note", "caption", "bubble".
- action "cursor": move Meera's pointer there. Use only when the user mentions the cursor.
- action "none": the target is NOT in the list, or the user is not asking to mark anything. Leave elementId empty.

Rules:
- elementId MUST be one of the listed ids (e.g. e7). Never invent an id or output coordinates.
- Match on the element's visible text and the position hints. Prefer the most specific match.
- If several elements match, pick the one whose text and position best fit the request.
- Use the recent conversation (when provided) to resolve references like "it", "that", or "the one below" to a concrete element.
- Keep message to a short, friendly label (<= 60 chars). When action is none, message briefly says why.
`.trim();

export type SelectionHistoryTurn = { role: string; content: string };

function renderHistory(history: SelectionHistoryTurn[]): string {
	const recent = history.filter((turn) => turn.content?.trim()).slice(-4);
	if (recent.length === 0) return "";
	const lines = recent.map((turn) => `${turn.role === "assistant" ? "Meera" : "User"}: ${turn.content.trim().slice(0, 160)}`);
	return ['Recent conversation (resolve references like "it" or "that" against this):', ...lines, ""].join("\n");
}

export const SELECT_OVERLAY_TARGET_TOOL = {
	type: "function",
	function: {
		name: "select_overlay_target",
		description: "Select which detected on-screen element to mark, and how to mark it.",
		parameters: {
			type: "object",
			required: ["action"],
			properties: {
				action: {
					type: "string",
					enum: ["arrow", "highlight", "bubble", "cursor", "none"],
					description: "How to mark the chosen element.",
				},
				elementId: {
					type: "string",
					description: "The id of the chosen candidate (e.g. e7). Empty string when action is none.",
				},
				message: {
					type: "string",
					description: "Short label to display on the overlay (<= 60 chars).",
				},
			},
		},
	},
} as const;

export function buildSelectionMessages(
	prompt: string,
	candidates: GroundingCandidate[],
	history: SelectionHistoryTurn[] = [],
): AiChatInputMessage[] {
	const historyBlock = renderHistory(history);
	const content = [
		...(historyBlock ? [historyBlock] : []),
		`User request: "${prompt.trim().slice(0, 400)}"`,
		"",
		"On-screen elements:",
		renderCandidatesForPrompt(candidates),
		"",
		"Call select_overlay_target with the best element id and action.",
	].join("\n");
	return [{ role: "user", content }];
}

function parseArgs(value: string | Record<string, unknown> | undefined): Record<string, unknown> {
	if (value && typeof value === "object") return value;
	if (typeof value !== "string") return {};
	try {
		const parsed = JSON.parse(value) as unknown;
		return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
	} catch {
		return {};
	}
}

function selectionFromArgs(args: Record<string, unknown>): OverlaySelection | null {
	const action = args.action;
	if (!isOverlayAction(action)) return null;
	const elementId = typeof args.elementId === "string" ? args.elementId.trim() : "";
	const message = typeof args.message === "string" ? args.message.trim() : "";
	return { action, elementId, message };
}

/** Find a select_overlay_target call (or a JSON object in prose) and turn it into an OverlaySelection. */
export function parseSelection(toolCalls: AiToolCall[] | undefined, content: string | null | undefined): OverlaySelection | null {
	for (const toolCall of toolCalls ?? []) {
		if (toolCall.function?.name !== "select_overlay_target") continue;
		const selection = selectionFromArgs(parseArgs(toolCall.function?.arguments));
		if (selection) return selection;
	}
	// Fallback: the model wrote the JSON in prose instead of calling the tool.
	const match = content ? /\{[\s\S]*"action"[\s\S]*\}/.exec(content) : null;
	if (match) {
		try {
			const selection = selectionFromArgs(JSON.parse(match[0]) as Record<string, unknown>);
			if (selection) return selection;
		} catch {
			// ignore malformed JSON
		}
	}
	return null;
}

/** Resolve a selection against the candidate list into executable overlay tool calls. */
export function selectionToToolCalls(selection: OverlaySelection | null, candidates: GroundingCandidate[]): AiToolCall[] {
	if (!selection || selection.action === "none" || !selection.elementId) return [];
	const candidate = candidateById(candidates, selection.elementId);
	if (!candidate) return [];
	return [candidateToOverlayToolCall(candidate, selection.action, selection.message)];
}
