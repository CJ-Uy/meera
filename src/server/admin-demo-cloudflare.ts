import { adminDemoFallback, loadAdminDemoSnapshot } from "@/features/admin/admin-demo-data";
import { getCloudflareEnvAsync } from "./cloudflare";

type D1Env = CloudflareEnv & {
	DB?: Parameters<typeof loadAdminDemoSnapshot>[0];
};

type WritableD1 = {
	prepare: (query: string) => {
		bind: (...values: unknown[]) => {
			run: () => Promise<unknown>;
		};
	};
};

export type AdminDemoFaqDraft = {
	faqId: string;
	answer?: string;
	escalateIf?: string;
};

export async function loadAdminDemoSnapshotFromCloudflare() {
	const env = (await getCloudflareEnvAsync()) as D1Env;
	return loadAdminDemoSnapshot(env.DB);
}

export async function updateAdminDemoFaqDraft(draft: AdminDemoFaqDraft) {
	const env = (await getCloudflareEnvAsync()) as D1Env;
	const db = env.DB as WritableD1 | undefined;
	if (!db) return null;

	await db
		.prepare("UPDATE aic_knowledge_article SET ContentSummary = ?, EscalationBoundary = ?, LastVerified = ? WHERE ArticleCode = ?")
		.bind(draft.answer ?? "", draft.escalateIf ?? "", new Date().toISOString().slice(0, 10), draft.faqId)
		.run();

	return { ok: true, source: "d1" as const, draft };
}

export async function loadAdminDemoSnapshotWithFallback() {
	try {
		return await loadAdminDemoSnapshotFromCloudflare();
	} catch {
		return adminDemoFallback;
	}
}
