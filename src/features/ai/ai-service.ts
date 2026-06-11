import { getDatabaseAdapter } from "@/db";
import { chatWithGroq, getGroqStatus } from "@/features/ai/groq-client";
import { supportTicketToDemoTicket } from "@/features/ai/support-ticket";
import { chatWithWorkersAi, getWorkersAiStatus } from "@/features/ai/workers-ai-client";
import type {
	AiChatRequest,
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

export async function chatWithAi(request: AiChatRequest): Promise<AiChatResponse> {
	const response = configuredAiProvider() === "groq" ? await chatWithGroq(request) : await chatWithWorkersAi(request);
	if (request.mode === "support") return finalizeSupportResponse(request, response);
	return response;
}

export async function getAiStatus(): Promise<AiProviderStatus> {
	const provider = configuredAiProvider();
	const status = provider === "groq" ? await getGroqStatus() : await getWorkersAiStatus();
	return { ...status, configuredProvider: provider };
}
