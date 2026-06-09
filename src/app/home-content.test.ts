import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	architectureFlow,
	boundaryCards,
	comparisonRows,
	integrations,
	landingSections,
	meeraIconAsset,
	ticketPreview,
	useCases,
	workflowSteps,
} from "@/app/home-content";

describe("Meera landing page content", () => {
	it("defines the required homepage sections in the design-plan order", () => {
		expect(landingSections).toEqual([
			"Navbar",
			"Hero",
			"Problem",
			"Solution Workflow",
			"Product Demo Preview",
			"Integrations",
			"Use Cases",
			"Differentiation",
			"Trust and Boundaries",
			"Architecture Preview",
			"Demo CTA",
			"Final CTA",
			"Footer",
		]);
	});

	it("covers the core workflow, integrations, use cases, and safety boundaries", () => {
		expect(workflowSteps.map((step) => step.title)).toEqual(["Understand", "Classify", "Resolve", "Package", "Route"]);
		expect(integrations).toHaveLength(8);
		expect(useCases.map((useCase) => useCase.title)).toEqual([
			"IT Helpdesk",
			"Registrar / Academic Operations",
			"Finance / Billing",
			"Campus Health / Medical Admin",
			"Student Services / General Operations",
			"Enterprise Operations",
		]);
		expect(boundaryCards).toHaveLength(6);
		expect(comparisonRows).toHaveLength(6);
		expect(architectureFlow.at(0)).toBe("User Message");
		expect(architectureFlow.at(-1)).toBe("Staff Dashboard");
	});

	it("keeps escalation copy human-in-the-loop and finance-safe", () => {
		expect(ticketPreview.office).toBe("Finance / Billing Support");
		expect(ticketPreview.priority).toBe("Normal");
		expect(ticketPreview.escalationReason).toContain("requires staff review");
		expect(ticketPreview.suggestedAction).toContain("Verify payment record");
	});

	it("uses the uploaded Meera icon as the canonical mascot asset", () => {
		expect(meeraIconAsset.src).toBe("/assets/meera/meera_icon.svg");
		expect(meeraIconAsset.alt).toContain("Meera");
	});

	it("labels demo CTAs as open-demo actions", () => {
		const source = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");

		expect(source).toContain("Open Demo");
		expect(source).not.toContain("Book a demo");
	});
});
