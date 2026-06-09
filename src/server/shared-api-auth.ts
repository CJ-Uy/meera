import { getOptionalCloudflareEnv } from "./cloudflare";

type SharedApiAuthResult =
	| { authorized: true }
	| {
			authorized: false;
			status: 401 | 503;
			error: string;
	  };

export function getSharedApiToken() {
	const processToken = process.env.SHARED_API_TOKEN?.trim();
	if (processToken) return processToken;

	const cloudflareEnv = getOptionalCloudflareEnv() as (Record<string, unknown> & CloudflareEnv) | null;
	const bindingToken = cloudflareEnv?.SHARED_API_TOKEN;
	return typeof bindingToken === "string" && bindingToken.trim() ? bindingToken.trim() : undefined;
}

export function authorizeSharedApiRequest(request: Request, expectedToken = getSharedApiToken()): SharedApiAuthResult {
	if (!expectedToken) {
		return {
			authorized: false,
			status: 503,
			error: "Shared API token is not configured.",
		};
	}

	const authorization = request.headers.get("authorization") ?? "";
	if (authorization !== `Bearer ${expectedToken}`) {
		return {
			authorized: false,
			status: 401,
			error: "Unauthorized.",
		};
	}

	return { authorized: true };
}

export function sharedApiUnauthorizedResponse(result: Exclude<SharedApiAuthResult, { authorized: true }>) {
	return Response.json({ error: result.error }, { status: result.status });
}
