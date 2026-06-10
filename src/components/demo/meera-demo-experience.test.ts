import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

describe("Meera demo experience", () => {
	const source = read("src/components/demo/meera-demo-experience.tsx");

	it("splits into separate student and admin experiences", () => {
		expect(source).toContain("export function StudentExperience(");
		expect(source).toContain("export function AdminExperience(");
		// The old combined component and its demo chrome are gone.
		expect(source).not.toContain("MeeraDemoExperience");
		expect(source).not.toContain("· DEMO ·");
		expect(source).not.toContain("X Exit");
	});

	it("keeps the student journey: landing -> Build the Mound with a Classic/Battle toggle", () => {
		expect(source).toContain("function StudentMeeraSite(");
		expect(source).toContain("function StudentMound(");
		expect(source).toContain('setStudentView("mound")');
		expect(source).toContain("<ModeToggle view={view} onChange={setView} />");
		expect(source).toContain("<BattleView />");
		expect(source).toContain("<CaseMeter stage={stage} damage={damage} fixed={fixChoice === \"fixed\"} />");
	});

	it("drops the embedded and screenshare student views entirely", () => {
		expect(source).not.toContain("StudentEmbedded");
		expect(source).not.toContain("StudentScreenshare");
		expect(source).not.toContain("PortalShell");
	});
});

describe("Mound Battle view", () => {
	const battle = read("src/components/demo/battle.tsx");

	it("is a self-contained hardcoded battle with HP, win and lose states", () => {
		expect(battle).toContain("export function BattleView(");
		expect(battle).toContain("function HpBar(");
		expect(battle).toContain("WinOverlay");
		expect(battle).toContain("LoseOverlay");
		// Losing escalates to the admin ticket flow.
		expect(battle).toContain("#NV-4827");
	});
});
