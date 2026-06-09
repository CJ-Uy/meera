import { NextResponse } from "next/server";
import { getDatabaseAdapterName } from "@/db";
import { getOptionalCloudflareEnv, hasCloudflareBindings } from "@/server/cloudflare";
import { describeRequiredEnv, getAppEnv } from "@/server/env";
import { getStorageAdapterName } from "@/storage";

export async function GET() {
	try {
		const env = getAppEnv();
		const cloudflareEnv = getOptionalCloudflareEnv();

		return NextResponse.json({
			ok: true,
			APP_ENV: env.APP_ENV,
			STORAGE_MODE: env.STORAGE_MODE,
			databaseAdapter: getDatabaseAdapterName(env, Boolean(cloudflareEnv?.DB)),
			storageAdapter: getStorageAdapterName(env),
			requiredEnv: describeRequiredEnv(env),
			cloudflareBindings: {
				available: hasCloudflareBindings(cloudflareEnv),
				DB: Boolean(cloudflareEnv?.DB),
				BUCKET: Boolean(cloudflareEnv?.BUCKET),
			},
		});
	} catch (error) {
		return NextResponse.json(
			{
				ok: false,
				error: error instanceof Error ? error.message : "Health check failed.",
			},
			{ status: 500 },
		);
	}
}
