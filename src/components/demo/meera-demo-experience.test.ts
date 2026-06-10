import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Meera demo experience", () => {
	const source = readFileSync(join(process.cwd(), "src/components/demo/meera-demo-experience.tsx"), "utf8");

	it("collapses the student journey to a single chatbot flow: landing -> Build the Mound", () => {
		expect(source).toContain("function StudentMeeraSite(");
		expect(source).toContain("function StudentMound(");
		// Sending from the landing screen jumps straight into the mound chat.
		expect(source).toContain('setStudentView("mound")');
		// The mound chat always shows the live case meter on the right.
		expect(source).toContain("<CaseMeter stage={stage} damage={damage} fixed={fixChoice === \"fixed\"} />");
	});

	it("drops the embedded and screenshare student views entirely", () => {
		expect(source).not.toContain("StudentEmbedded");
		expect(source).not.toContain("StudentScreenshare");
		expect(source).not.toContain("PortalShell");
	});
});
