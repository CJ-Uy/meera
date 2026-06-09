import { describe, expect, test } from "vitest";
import { getDatabaseAdapterName } from "./index";

describe("getDatabaseAdapterName", () => {
	test("selects shared API for shared app env", () => {
		expect(
			getDatabaseAdapterName({
				APP_ENV: "shared",
				STORAGE_MODE: "local",
				SHARED_API_BASE_URL: "https://shared.example.test",
				SHARED_API_TOKEN: "dev-token",
				LOCAL_SQLITE_PATH: "./.local/dev.db",
				LOCAL_STORAGE_DIR: "./.local/uploads",
			}),
		).toBe("shared-api");
	});

	test("selects D1 binding for production", () => {
		expect(
			getDatabaseAdapterName({
				APP_ENV: "production",
				STORAGE_MODE: "binding",
				LOCAL_SQLITE_PATH: "./.local/dev.db",
				LOCAL_STORAGE_DIR: "./.local/uploads",
			}),
		).toBe("d1");
	});
});
