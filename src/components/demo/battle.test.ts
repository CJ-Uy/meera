import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_BOSS, MYSTERY_BOSS, pickBosses } from "@/components/demo/battle-bosses";

describe("battle demo polish", () => {
	it("uses the refreshed battle shell with the quest tracker and combo state", () => {
		const source = readFileSync(join(process.cwd(), "src/components/demo/battle.tsx"), "utf8");

		expect(source).toContain("battle-arena-shell");
		expect(source).toContain("QuestTracker");
		expect(source).toContain("combo");
		expect(source).toContain("miraHp");
		expect(source).toContain("setMiraHp");
		expect(source).toContain("setMiraFloater");
		expect(source).toContain("suggestedReplies");
		expect(source).toContain("sendText");
		expect(source).toContain("pickBosses");
		expect(source).toContain("MYSTERY_BOSS");
		expect(source).toContain("predictionFallbackMoves");
		expect(source).toContain("predicted reply");
		expect(source).toContain("I feel better now");
		expect(source).toContain("I need medical attention now");
		expect(source).toContain("HowToPlayModal");
		expect(source).toContain('hp={won ? MAX_HP : miraHp}');
		expect(source).not.toContain('<NamePlate name="MiRA" level={15} hp={100}');
		expect(source).not.toContain("const QUEST");
		expect(source).not.toContain("LoseOverlay");
	});

	it("ships a regenerated higher-detail cobra idle asset", () => {
		const asset = statSync(join(process.cwd(), "public/assets/battle/cobra-idle.png"));

		expect(asset.size).toBeGreaterThan(60_000);
	});

	it("explains enemy HP and MiRA morale separately", () => {
		const source = readFileSync(join(process.cwd(), "src/components/demo/how-to-play-modal.tsx"), "utf8");

		expect(source).toContain("MiRA takes a hit");
		expect(source).toContain("does not move the case forward");
	});

	it("maps departments to dynamic bosses", () => {
		expect(pickBosses([])).toEqual([DEFAULT_BOSS]);
		expect(MYSTERY_BOSS.name).toBe("???");
		expect(MYSTERY_BOSS.sprites.idle).toContain("battle/mystery/idle.png");
		expect(DEFAULT_BOSS.kind).toContain("Hawk type");
		expect(DEFAULT_BOSS.sprites.idle).toContain("battle/hawk/idle.png");
		expect(pickBosses(["IT"]).map((boss) => boss.id)).toEqual(["hawk"]);
		expect(pickBosses(["IT", "Finance", "IT", "Health", "Registrar"]).map((boss) => boss.id)).toEqual([
			"hawk",
			"jackal",
			"eagle",
		]);
	});

	it("ships new generated boss assets", () => {
		for (const boss of ["hawk", "jackal", "eagle", "caracal", "mystery"]) {
			for (const state of ["idle", "defeated"]) {
				const asset = statSync(join(process.cwd(), `public/assets/battle/${boss}/${state}.png`));
				expect(asset.size).toBeGreaterThan(10_000);
			}
		}
	});
});
