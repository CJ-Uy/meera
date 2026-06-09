import { describe, expect, test } from "vitest";
import { authorizeSharedApiRequest } from "./shared-api-auth";

describe("authorizeSharedApiRequest", () => {
	test("rejects requests when the shared API token is missing", () => {
		const request = new Request("https://example.test/internal/users");

		const result = authorizeSharedApiRequest(request, undefined);

		expect(result.authorized).toBe(false);
		if (result.authorized) throw new Error("Expected request to be rejected.");
		expect(result.status).toBe(503);
	});

	test("rejects requests without a matching bearer token", () => {
		const request = new Request("https://example.test/internal/users", {
			headers: { Authorization: "Bearer wrong-token" },
		});

		const result = authorizeSharedApiRequest(request, "expected-token");

		expect(result.authorized).toBe(false);
		if (result.authorized) throw new Error("Expected request to be rejected.");
		expect(result.status).toBe(401);
	});

	test("accepts a matching bearer token", () => {
		const request = new Request("https://example.test/internal/users", {
			headers: { Authorization: "Bearer expected-token" },
		});

		const result = authorizeSharedApiRequest(request, "expected-token");

		expect(result.authorized).toBe(true);
	});
});
