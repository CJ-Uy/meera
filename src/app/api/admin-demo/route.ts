import { NextResponse } from "next/server";
import {
	loadAdminDemoSnapshotWithFallback,
	updateAdminDemoFaqDraft,
	type AdminDemoFaqDraft,
} from "@/server/admin-demo-cloudflare";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

function isFaqDraft(value: unknown): value is AdminDemoFaqDraft {
	return typeof value === "object" && value !== null && "faqId" in value && typeof (value as { faqId?: unknown }).faqId === "string";
}

export async function GET() {
	return NextResponse.json(await loadAdminDemoSnapshotWithFallback(), { headers: corsHeaders });
}

export async function PUT(request: Request) {
	const draft: unknown = await request.json().catch(() => null);

	try {
		if (isFaqDraft(draft)) {
			const result = await updateAdminDemoFaqDraft(draft);
			if (result) return NextResponse.json(result, { headers: corsHeaders });
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
