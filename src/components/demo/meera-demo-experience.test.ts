import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Meera demo experience", () => {
	it("lets the student embedded portal fill the demo viewport", () => {
		const source = readFileSync(join(process.cwd(), "src/components/demo/meera-demo-experience.tsx"), "utf8");

		expect(source).toContain('function PortalShell({ children, active = "Registration", className = "" }');
		expect(source).toContain('${className}');
		expect(source).toContain('<PortalShell active="Financials" className="min-h-[calc(100vh-94px)]">');
	});
});
