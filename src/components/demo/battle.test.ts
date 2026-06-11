import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("battle demo polish", () => {
	it("uses the refreshed battle shell with threat map and combo state", () => {
		const source = readFileSync(join(process.cwd(), "src/components/demo/battle.tsx"), "utf8");

		expect(source).toContain("battle-arena-shell");
		expect(source).toContain("Threat map");
		expect(source).toContain("combo");
	});

	it("ships a regenerated higher-detail cobra idle asset", () => {
		const asset = statSync(join(process.cwd(), "public/assets/battle/cobra-idle.png"));

		expect(asset.size).toBeGreaterThan(60_000);
	});
});
