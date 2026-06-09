import { getCloudflareContext } from "@opennextjs/cloudflare";

export type CloudflareAppEnv = CloudflareEnv & {
	DB?: D1Database;
	BUCKET?: R2Bucket;
};

export function getCloudflareEnv(): CloudflareAppEnv {
	const { env } = getCloudflareContext();
	if (!env) {
		throw new Error("Cloudflare bindings are unavailable in this runtime.");
	}
	return env as CloudflareAppEnv;
}

export async function getCloudflareEnvAsync(): Promise<CloudflareAppEnv> {
	const { env } = await getCloudflareContext({ async: true });
	if (!env) {
		throw new Error("Cloudflare bindings are unavailable in this runtime.");
	}
	return env as CloudflareAppEnv;
}

export function getOptionalCloudflareEnv(): CloudflareAppEnv | null {
	try {
		return getCloudflareEnv();
	} catch {
		return null;
	}
}

export function hasCloudflareBindings(env = getOptionalCloudflareEnv()) {
	return Boolean(env?.DB && env?.BUCKET);
}
