import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pickBosses, DEFAULT_BOSS } from "@/components/demo/battle-bosses";

describe("battle demo polish", () => {
	it("uses the refreshed battle shell with the quest tracker and combo state", () => {
		const source = readFileSync(join(process.cwd(), "src/components/demo/battle.tsx"), "utf8");

		expect(source).toContain("battle-arena-shell");
		expect(source).toContain("QuestTracker");
		expect(source).toContain("combo");
		expect(source).toContain("suggestedReplies");
		expect(source).toContain("sendText");
		expect(source).toContain("pickBosses");
		expect(source).toContain("HowToPlayModal");
		expect(source).not.toContain("const QUEST");
		expect(source).not.toContain("LoseOverlay");
	});

	it("ships a regenerated higher-detail cobra idle asset", () => {
		const asset = statSync(join(process.cwd(), "public/assets/battle/cobra-idle.png"));

		expect(asset.size).toBeGreaterThan(60_000);
	});

	it("maps departments to dynamic bosses", () => {
		expect(pickBosses([])).toEqual([DEFAULT_BOSS]);
		expect(pickBosses(["IT"]).map((boss) => boss.id)).toEqual(["hawk"]);
		expect(pickBosses(["IT", "Finance", "IT", "Health", "Registrar"]).map((boss) => boss.id)).toEqual([
			"hawk",
			"jackal",
			"eagle",
		]);
	});

	it("ships new generated boss assets", () => {
		for (const boss of ["hawk", "jackal", "eagle", "caracal"]) {
			for (const state of ["idle", "defeated"]) {
				const asset = statSync(join(process.cwd(), `public/assets/battle/${boss}/${state}.png`));
				expect(asset.size).toBeGreaterThan(10_000);
			}
		}
	});
});
