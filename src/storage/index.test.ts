import { describe, expect, test } from "vitest";
import { getStorageAdapterName } from "./index";

describe("getStorageAdapterName", () => {
	test.each([
		["production bindings", { APP_ENV: "production", STORAGE_MODE: "binding" }, "r2-binding"],
		["explicit API mode", { APP_ENV: "shared", STORAGE_MODE: "api" }, "shared-api"],
		["explicit S3 mode", { APP_ENV: "shared", STORAGE_MODE: "r2-s3" }, "r2-s3"],
		["local filesystem mode", { APP_ENV: "local", STORAGE_MODE: "local" }, "local-fs"],
	] as const)("selects %s", (_label, input, expected) => {
		expect(
			getStorageAdapterName({
				...input,
				SHARED_API_BASE_URL: "https://shared.example.test",
				SHARED_API_TOKEN: "dev-token",
				R2_ACCOUNT_ID: "account",
				R2_BUCKET_NAME: "bucket",
				R2_ACCESS_KEY_ID: "access",
				R2_SECRET_ACCESS_KEY: "secret",
				R2_ENDPOINT: "https://example.r2.cloudflarestorage.com",
				LOCAL_SQLITE_PATH: "./.local/dev.db",
				LOCAL_STORAGE_DIR: "./.local/uploads",
			}),
		).toBe(expected);
	});
});
