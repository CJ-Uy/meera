import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("SupportStudio navigation", () => {
	it("links the top-left heading back to the home page", () => {
		const source = readFileSync(join(process.cwd(), "src/components/support-studio.tsx"), "utf8");

		expect(source).toContain('href="/"');
	});

	it("offers student and admin demo views as top tabs", () => {
		const source = readFileSync(join(process.cwd(), "src/components/support-studio.tsx"), "utf8");

		expect(source).toContain('role="tablist"');
		expect(source).toContain("Student / Inquirer");
		expect(source).toContain("Admin");
	});

	it("shows an admin department flow for support tickets", () => {
		const source = readFileSync(join(process.cwd(), "src/components/support-studio.tsx"), "utf8");
		const dataSource = readFileSync(join(process.cwd(), "src/features/admin/admin-demo-data.ts"), "utf8");

		expect(source).toContain("Ticket flow");
		expect(dataSource).toContain("IT Department");
		expect(dataSource).toContain("Registrar");
		expect(dataSource).toContain("Medical / Campus Health Services");
		expect(dataSource).toContain("Student Services");
	});

	it("presents an admin FAQ editor and ticket response workspace", () => {
		const source = readFileSync(join(process.cwd(), "src/components/support-studio.tsx"), "utf8");

		expect(source).toContain("FAQ editor");
		expect(source).toContain("Edit answer");
		expect(source).toContain("Save draft");
		expect(source).toContain("Ticket queue");
		expect(source).toContain("Response composer");
	});

	it("loads admin demo content from the shared D1-ready data module", () => {
		const source = readFileSync(join(process.cwd(), "src/components/support-studio.tsx"), "utf8");
		const apiSource = readFileSync(join(process.cwd(), "src/app/api/admin-demo/route.ts"), "utf8");

		expect(source).toContain("@/features/admin/admin-demo-data");
		expect(source).toContain("NEXT_PUBLIC_ADMIN_DEMO_API_BASE");
		expect(apiSource).toContain("getCloudflareContext");
		expect(apiSource).toContain("loadAdminDemoSnapshot");
	});

	it("documents the shared remote admin demo API for account-free local development", () => {
		const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");
		const devVarsExample = readFileSync(join(process.cwd(), ".dev.vars.example"), "utf8");
		const guide = readFileSync(join(process.cwd(), "db/README_IMPORT_GUIDE.md"), "utf8");

		expect(envExample).toContain("NEXT_PUBLIC_ADMIN_DEMO_API_BASE=https://meera-admin-demo-api.cj-uy.workers.dev");
		expect(devVarsExample).toContain("NEXT_PUBLIC_ADMIN_DEMO_API_BASE=https://meera-admin-demo-api.cj-uy.workers.dev");
		expect(guide).toContain("Local devs do not need Cloudflare accounts");
	});
});
