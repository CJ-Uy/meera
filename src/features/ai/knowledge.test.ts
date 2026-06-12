import { beforeEach, describe, expect, it, vi } from "vitest";

// No database in the unit environment: force the DB path to fail so we exercise the built-in AISIS
// guide on its own (retrieval must still work when the DB is empty or unreachable).
vi.mock("@/db", () => ({
	getDatabaseAdapter: () => ({
		loadAdminSnapshot: async () => {
			throw new Error("no database in test");
		},
	}),
}));

import { clearKnowledgeCache, retrieveKnowledgeContext } from "@/features/ai/knowledge";

describe("AISIS knowledge retrieval", () => {
	beforeEach(() => clearKnowledgeCache());

	it("pulls the class-schedule guide for the demo question", async () => {
		const context = await retrieveKnowledgeContext("how can I see my class schedule?");
		expect(context).toContain("MY CLASS SCHEDULE");
	});

	it("pulls the tuition-receipt guide", async () => {
		const context = await retrieveKnowledgeContext("how do I print my tuition receipt?");
		expect(context).toContain("PRINT TUITION RECEIPT");
		expect(context).toContain("Print Tuition Receipt for School Year");
	});

	it("pulls the syllabus guide", async () => {
		const context = await retrieveKnowledgeContext("where do I view my syllabus?");
		expect(context.toLowerCase()).toContain("syllabus");
		expect(context).toContain("MY CURRENTLY ENROLLED CLASSES");
	});

	it("returns nothing for an unrelated query", async () => {
		expect(await retrieveKnowledgeContext("xyzzy qwerty zzz")).toBe("");
	});

	it("ignores empty or whitespace-only queries", async () => {
		expect(await retrieveKnowledgeContext("   ")).toBe("");
	});
});
