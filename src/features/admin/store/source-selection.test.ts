import { describe, expect, test } from "vitest";
import { getAdminSourceMode } from "./source-selection";

describe("admin source selection", () => {
	test("defaults to in-memory when NEXT_PUBLIC_ADMIN_SOURCE is unset", () => {
		expect(getAdminSourceMode(undefined)).toBe("memory");
	});

	test("selects the API source only behind the explicit api flag", () => {
		expect(getAdminSourceMode("api")).toBe("api");
		expect(getAdminSourceMode("memory")).toBe("memory");
		expect(getAdminSourceMode("shared")).toBe("memory");
	});
});
