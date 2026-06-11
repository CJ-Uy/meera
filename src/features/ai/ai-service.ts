import { getDatabaseAdapter } from "@/db";
import { chatWithGroq, completeGroqText, getGroqStatus } from "@/features/ai/groq-client";
import { supportTicketToDemoTicket } from "@/features/ai/support-ticket";
import { chatWithWorkersAi, completeWorkersAiText, getWorkersAiStatus } from "@/features/ai/workers-ai-client";
import type {
	AiChatRequest,
	AiChatInputMessage,
	AiChatResponse,
	AiProviderName,
	AiProviderStatus,
} from "@/features/ai/ai-types";

/**
 * Provider seam. Defaults to Cloudflare Workers AI; set AI_PROVIDER=groq to fall back to Groq during the
 * migration (lets us A/B and roll back instantly without code changes).
 */
export function configuredAiProvider(): AiProviderName {
	return process.env.AI_PROVIDER?.trim() === "groq" ? "groq" : "workers-ai";
}

function ticketNumberFrom(id: string) {
	const slug = id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
	return `MEERA-${slug || id.slice(-6).toUpperCase()}`;
}

/**
 * Persist a support-orchestrator ticket and turn it into the student-facing `ticket` field. The raw
 * `supportTicketArgs` never reaches the client, and we only claim a ticket exists after the DB write
 * succeeds (master prompt guardrail §17.2).
 */
async function finalizeSupportResponse(request: AiChatRequest, response: AiChatResponse): Promise<AiChatResponse> {
	const { supportTicketArgs, ...rest } = response;
	if (!supportTicketArgs) return rest;

	try {
		const demoTicket = supportTicketToDemoTicket(supportTicketArgs, request.messages);
		const { id } = await getDatabaseAdapter().createTicket(demoTicket);
		return {
			...rest,
			ticket: {
				id,
				ticketNumber: ticketNumberFrom(id),
				office: supportTicketArgs.responsibleOffice,
				category: supportTicketArgs.category,
				priority: supportTicketArgs.priority,
				studentFacingSummary: supportTicketArgs.studentFacingSummary ?? supportTicketArgs.issueSummary,
			},
		};
	} catch (error) {
		console.error("[Meera support] ticket persistence failed", error);
		return {
			...rest,
			message: "I've gathered everything the office needs, but I couldn't file the ticket just now. Please try sending that again in a moment.",
		};
	}
}

export function parseSuggestedReplies(text: string): string[] {
	const match = /\[[\s\S]*\]/.exec(text);
	if (!match) return [];
	try {
		const parsed = JSON.parse(match[0]) as unknown;
		if (!Array.isArray(parsed)) return [];
		const seen = new Set<string>();
		const replies: string[] = [];
		for (const entry of parsed) {
			if (typeof entry !== "string") continue;
			const reply = entry.replace(/\s+/g, " ").trim();
			if (!reply || reply.length > 80 || seen.has(reply.toLowerCase())) continue;
			seen.add(reply.toLowerCase());
			replies.push(reply);
			if (replies.length >= 3) break;
		}
		return replies;
	} catch {
		return [];
	}
}

function transcriptForSuggestions(messages: AiChatInputMessage[], assistantMessage: string) {
	return [
		...messages.slice(-6),
		{ role: "assistant" as const, content: assistantMessage },
	]
		.map((message) => `${message.role}: ${message.content}`)
		.join("\n");
}

async function generateSuggestedReplies(request: AiChatRequest, assistantMessage: string): Promise<string[]> {
	const system =
		'You generate 2-3 predictive quick replies the STUDENT may want to send next in this support chat. Each <= 8 words, first-person, natural, context-specific, and varied across likely paths: resolved/feeling better, still stuck, urgent help, provide missing info, decline/close, or request staff. If the context is health-related, options may include replies like "I feel better now" or "I need medical attention now". Return ONLY a JSON array of strings.';
	const user = transcriptForSuggestions(request.messages, assistantMessage);
	const raw =
		configuredAiProvider() === "groq"
			? await completeGroqText({ system, user })
			: await completeWorkersAiText({ system, user });
	return parseSuggestedReplies(raw);
}

export async function chatWithAi(request: AiChatRequest): Promise<AiChatResponse> {
	const response = configuredAiProvider() === "groq" ? await chatWithGroq(request) : await chatWithWorkersAi(request);
	if (request.mode === "support") {
		const finalized = await finalizeSupportResponse(request, response);
		if (!request.wantsSuggestedReplies) return finalized;
		try {
			return {
				...finalized,
				suggestedReplies: await generateSuggestedReplies(request, finalized.message),
			};
		} catch {
			return { ...finalized, suggestedReplies: [] };
		}
	}
	return response;
}

export async function getAiStatus(): Promise<AiProviderStatus> {
	const provider = configuredAiProvider();
	const status = provider === "groq" ? await getGroqStatus() : await getWorkersAiStatus();
	return { ...status, configuredProvider: provider };
}
