import { describe, expect, test } from "vitest";
import { POST as setSeverity } from "./tickets/[id]/severity/route";

describe("admin API routes", () => {
	test("rejects mutations without an acting admin id", async () => {
		const response = await setSeverity(
			new Request("http://localhost/api/admin/tickets/AIC-1/severity", {
				method: "POST",
				body: JSON.stringify({ severity: "High" }),
			}),
			{ params: Promise.resolve({ id: "AIC-1" }) },
		);

		expect(response?.status).toBe(400);
	});
});
