import { describe, expect, test } from "vitest";
import { parseAppEnv } from "./env";

describe("parseAppEnv", () => {
	test("defaults to local app and local storage mode", () => {
		const env = parseAppEnv({});

		expect(env.APP_ENV).toBe("local");
		expect(env.STORAGE_MODE).toBe("local");
		expect(env.LOCAL_SQLITE_PATH).toBe("./.local/dev.db");
		expect(env.LOCAL_STORAGE_DIR).toBe("./.local/uploads");
	});

	test("requires shared API credentials in shared mode", () => {
		expect(() => parseAppEnv({ APP_ENV: "shared" })).toThrow(/SHARED_API_BASE_URL/);
		expect(() =>
			parseAppEnv({
				APP_ENV: "shared",
				SHARED_API_BASE_URL: "https://shared.example.test",
				SHARED_API_TOKEN: "dev-token",
			}),
		).not.toThrow();
	});

	test("requires all S3-compatible R2 values in r2-s3 mode", () => {
		expect(() => parseAppEnv({ STORAGE_MODE: "r2-s3" })).toThrow(/R2_ACCOUNT_ID/);
		expect(() =>
			parseAppEnv({
				STORAGE_MODE: "r2-s3",
				R2_ACCOUNT_ID: "account",
				R2_BUCKET_NAME: "bucket",
				R2_ACCESS_KEY_ID: "access",
				R2_SECRET_ACCESS_KEY: "secret",
				R2_ENDPOINT: "https://example.r2.cloudflarestorage.com",
			}),
		).not.toThrow();
	});
});
