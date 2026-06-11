import { describe, expect, it } from "vitest";
import { MEERA_SUPPORT_SYSTEM_PROMPT } from "@/features/ai/ai-prompt";
import { AI_SUPPORT_TOOLS } from "@/features/ai/ai-tools";

describe("Meera support prompt", () => {
	it("requires probing and safe resolution before ticket escalation", () => {
		expect(MEERA_SUPPORT_SYSTEM_PROMPT).toContain("attempt safe resolution");
		expect(MEERA_SUPPORT_SYSTEM_PROMPT).toContain("Urgency raises priority, but does not by itself skip probing or safe resolution.");
		expect(MEERA_SUPPORT_SYSTEM_PROMPT).toContain("Do not create a ticket simply because");

		const createTicket = AI_SUPPORT_TOOLS.find((tool) => tool.function.name === "create_support_ticket");
		expect(createTicket?.function.description).toContain("after appropriate probing and safe resolution attempts");
	});
});
