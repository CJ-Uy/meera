import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { adminDemoFallback, loadAdminDemoSnapshot } from "@/features/admin/admin-demo-data";

export const runtime = "edge";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

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

type FaqDraft = {
	faqId: string;
	answer?: string;
	escalateIf?: string;
};

function isFaqDraft(value: unknown): value is FaqDraft {
	return typeof value === "object" && value !== null && "faqId" in value && typeof (value as { faqId?: unknown }).faqId === "string";
}

export async function GET() {
	try {
		const { env } = await getCloudflareContext({ async: true });
		const snapshot = await loadAdminDemoSnapshot((env as D1Env).DB);

		return NextResponse.json(snapshot, { headers: corsHeaders });
	} catch {
		return NextResponse.json(adminDemoFallback, { headers: corsHeaders });
	}
}

export async function PUT(request: Request) {
	const draft: unknown = await request.json().catch(() => null);

	try {
		const { env } = await getCloudflareContext({ async: true });
		const db = (env as D1Env).DB as WritableD1 | undefined;

		if (db && isFaqDraft(draft)) {
			await db
				.prepare("UPDATE aic_knowledge_article SET ContentSummary = ?, EscalationBoundary = ?, LastVerified = ? WHERE ArticleCode = ?")
				.bind(draft.answer ?? "", draft.escalateIf ?? "", new Date().toISOString().slice(0, 10), draft.faqId)
				.run();

			return NextResponse.json({ ok: true, source: "d1", draft }, { headers: corsHeaders });
		}
	} catch {
		// Plain next dev has no Cloudflare context. Keep the demo editable locally.
	}

	return NextResponse.json({
		ok: true,
		source: "demo",
		message: "FAQ draft accepted for the demo CMS. Bind Cloudflare D1 as DB to persist edits.",
		draft,
	}, { headers: corsHeaders });
}

export function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders });
}
