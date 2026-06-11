import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("root layout metadata", () => {
	it("uses the Meera logo asset as the favicon", () => {
		const source = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");

		expect(source).toContain("/assets/meera/meera_icon.svg");
	});
});
