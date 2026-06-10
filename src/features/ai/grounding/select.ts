import type { AiChatInputMessage, AiToolCall } from "@/features/ai/ai-types";
import { candidateById, candidateToOverlayToolCall, renderCandidatesForPrompt } from "@/features/ai/grounding/candidates";
import { isOverlayAction, type GroundingCandidate, type OverlaySelection } from "@/features/ai/grounding/types";

/**
 * Element selection: a TEXT model (no coordinate regression) reads the user's request and the list of
 * detected on-screen elements, then names the element to mark and how. The chosen candidate's rect — not
 * the model — supplies the coordinates.
 */

const SELECTION_TASK = `
You are Meera's overlay targeting brain. You are given the user's request and a numbered list of
elements detected on their screen (each with an id, its visible text, and a rough position).

Choose the single element the user means and how to mark it:
- action "arrow": point at one thing. Default for "point at", "where is", "where do I click", picking one item.
- action "highlight": draw a box around a region. Use for "highlight", "box", "outline", "circle", "focus on".
- action "bubble": show a short text note at a spot. Use for "label", "note", "caption", "bubble".
- action "cursor": move Meera's pointer there. Use only when the user mentions the cursor.
- action "none": the target is NOT in the list, or the user is not asking to mark anything. Leave elementId empty.

Element types:
- Most entries show their visible text, e.g. e7: "Sign in".
- Entries shown as [region] are images, thumbnails, photos, video previews, or cards that contain no text
  of their own. Choose a [region] when the user asks to highlight/point at an image, thumbnail, video
  preview, picture, card, or tile (not its title text).

Rules:
- elementId MUST be one of the listed ids (e.g. e7 or r2). Never invent an id or output coordinates.
- Match on the element's visible text and the position hints. Prefer the most specific match.
- If several elements match, pick the one whose text and position best fit the request.
- Use the recent conversation (when provided) to resolve references like "it", "that", or "the one below" to a concrete element.
- Keep message to a short, friendly label (<= 60 chars). When action is none, message briefly says why.
`.trim();

// Groq path: forced tool-calling fills select_overlay_target's parameters.
export const SELECTION_SYSTEM_PROMPT = `${SELECTION_TASK}\n\nReturn your decision by calling select_overlay_target.`;

// Workers AI path: JSON mode (no tools). The model MUST emit only the JSON object — telling it to "call"
// a function makes it narrate the call in prose instead, which cannot be parsed.
export const SELECTION_JSON_SYSTEM_PROMPT = `${SELECTION_TASK}

Respond with ONLY a JSON object and no other text, in exactly this shape:
{"action": "arrow" | "highlight" | "bubble" | "cursor" | "none", "elementId": "<one of the listed ids, or empty string>", "message": "<short label>"}`;

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
		"Choose the single best element and how to mark it.",
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

const NESTED_KEYS = ["arguments", "parameters", "function", "tool_call", "select_overlay_target", "result"];

function selectionFromArgs(args: Record<string, unknown>): OverlaySelection | null {
	// Some models wrap the answer (e.g. {arguments:{…}} or {function:{action:…}}); unwrap one level.
	const objects: Record<string, unknown>[] = [args];
	for (const key of NESTED_KEYS) {
		const nested = args[key];
		if (nested && typeof nested === "object") objects.push(nested as Record<string, unknown>);
	}
	for (const object of objects) {
		if (!isOverlayAction(object.action)) continue;
		const elementId = typeof object.elementId === "string" ? object.elementId.trim() : "";
		const message = typeof object.message === "string" ? object.message.trim() : "";
		return { action: object.action, elementId, message };
	}
	return null;
}

/** Last resort: pull the choice out of prose when a weak model narrates instead of emitting JSON. */
function selectionFromProse(text: string): OverlaySelection | null {
	const actionMatch = /\baction\b\s*["']?\s*[:=]\s*["']?(arrow|highlight|bubble|cursor|none)\b/i.exec(text);
	if (!actionMatch) return null;
	const action = actionMatch[1].toLowerCase();
	if (!isOverlayAction(action)) return null;
	const idMatch = /\b(?:element[\s_]?id|id)\b\s*["']?\s*[:=]\s*["']?((?:e|r)\d+)\b/i.exec(text);
	const messageMatch = /\bmessage\b\s*["']?\s*[:=]\s*["']([^"'\n]{1,80})["']/i.exec(text);
	return { action, elementId: idMatch?.[1] ?? "", message: messageMatch?.[1]?.trim() ?? "" };
}

/** Turn a select_overlay_target tool call, a JSON object, or narrated prose into an OverlaySelection. */
export function parseSelection(toolCalls: AiToolCall[] | undefined, content: string | null | undefined): OverlaySelection | null {
	for (const toolCall of toolCalls ?? []) {
		if (toolCall.function?.name !== "select_overlay_target") continue;
		const selection = selectionFromArgs(parseArgs(toolCall.function?.arguments));
		if (selection) return selection;
	}
	if (!content) return null;
	// 1) The whole content is the JSON object (JSON mode).
	try {
		const selection = selectionFromArgs(JSON.parse(content.trim()) as Record<string, unknown>);
		if (selection) return selection;
	} catch {
		// not pure JSON — keep going
	}
	// 2) A JSON object embedded in surrounding text.
	const match = /\{[\s\S]*"action"[\s\S]*\}/.exec(content);
	if (match) {
		try {
			const selection = selectionFromArgs(JSON.parse(match[0]) as Record<string, unknown>);
			if (selection) return selection;
		} catch {
			// fall through to prose
		}
	}
	// 3) The model narrated its choice in prose ("action: highlight ... elementId: e2").
	return selectionFromProse(content);
}

/** Resolve a selection against the candidate list into executable overlay tool calls. */
export function selectionToToolCalls(selection: OverlaySelection | null, candidates: GroundingCandidate[]): AiToolCall[] {
	if (!selection || selection.action === "none" || !selection.elementId) return [];
	const candidate = candidateById(candidates, selection.elementId);
	if (!candidate) return [];
	return [candidateToOverlayToolCall(candidate, selection.action, selection.message)];
}
